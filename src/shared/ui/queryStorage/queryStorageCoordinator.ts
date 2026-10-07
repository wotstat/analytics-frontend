import { effectScope, ref, watch, type Ref } from 'vue'
import type { LocationQuery, LocationQueryRaw, RouteLocation, RouteLocationNormalized, RouteRecordNormalized, Router } from 'vue-router'
import type { DeferredWebHistory } from '../router/createDeferredWebHistory'
import type { QueryParam, QueryWriteOptions } from './queryStorageTypes'

type Encoded = string | null | undefined

type Navigation = {
  incoming: LocationQuery
  authoritative: boolean
  carriedTo?: string
}

type Entry = {
  key: string
  definition: QueryParam
  value: Ref<any>
  defaultValue: any
  epoch: number
  bindings: Set<Binding>
  pending?: { at: number, history: 'push' | 'replace' }
}

export type QueryOwner = {
  record?: RouteRecordNormalized
  active: boolean
  enabled: () => boolean
  bindings: Binding[]
}

export type Binding = {
  owner: QueryOwner
  entry: Entry
  label: string
  options: QueryWriteOptions
}

const storagePrefix = 'wotstat:query:v1:'
const coordinators = new WeakMap<Router, QueryStorageCoordinator>()

function defaultValue(definition: QueryParam) {
  return typeof definition.default === 'function' ? definition.default() : definition.default
}

function encode(definition: QueryParam, value: any): Encoded {
  if (value === undefined || value === null) return value
  if (definition.serialize) return definition.serialize(value)

  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'object') return JSON.stringify(value)

  return String(value)
}

function decode(definition: QueryParam, raw: unknown) {
  if (typeof raw !== 'string') return defaultValue(definition)

  try {
    if (definition.deserialize) return definition.deserialize(raw)

    const initial = defaultValue(definition)

    if (definition.type === Number || (!definition.type && typeof initial === 'number')) {
      if (!raw.trim() || !Number.isFinite(Number(raw))) throw new Error('Некорректное число')
      return Number(raw)
    }

    if (definition.type === Boolean || (!definition.type && typeof initial === 'boolean')) {
      if (raw === '1' || raw === 'true') return true
      if (raw === '0' || raw === 'false') return false
      throw new Error('Некорректное логическое значение')
    }

    if (definition.type !== String && initial !== null && typeof initial === 'object') return JSON.parse(raw)

    return raw
  } catch {
    return defaultValue(definition)
  }
}

function queryValue(entry: Entry): Encoded {
  const value = encode(entry.definition, entry.value.value)
  return value === encode(entry.definition, entry.defaultValue) ? undefined : value
}

function sameRecord(a: RouteRecordNormalized, b: RouteRecordNormalized) {
  return (a.aliasOf ?? a) === (b.aliasOf ?? b)
}

// Компоненты меняют значения, координатор собирает query для общего цикла записи history.
class QueryStorageCoordinator {
  private entries = new Map<string, Entry>()
  private labels = new Set<string>()
  private scope = effectScope(true)
  private navigations = new WeakMap<RouteLocation | RouteLocationNormalized, Navigation>()

  private epoch = 0
  private incoming: LocationQuery = {}
  private authoritative = true
  private reading = false
  private transitioning = false
  private pop = false

  private timer?: ReturnType<typeof setTimeout>
  private writing?: { to: string }
  private override?: { binding: Binding, options: QueryWriteOptions }

  constructor(private router: Router, private history: DeferredWebHistory) {
    this.incoming = { ...router.currentRoute.value.query }

    router.options.history.listen(() => { this.pop = true })

    router.beforeEach((to, from) => {
      if (this.isOwnWrite(to)) return

      this.transitioning = true
      return this.prepareNavigation(to, from)
    })

    router.afterEach((to, from, failure) => {
      if (this.isOwnWrite(to)) return

      this.transitioning = false

      if (failure) {
        this.pop = false
        this.schedule()
        return
      }

      if (this.epoch > 0 && !this.pop
        && to.path === from.path
        && JSON.stringify(to.query) === JSON.stringify(from.query)) {
        this.schedule()
        return
      }

      const navigation = this.navigations.get(to)
      this.authoritative = navigation?.authoritative ?? (this.epoch === 0 || this.pop)
      this.pop = false
      this.epoch++
      this.incoming = { ...(navigation?.incoming ?? to.query) }

      for (const entry of this.entries.values()) {
        entry.pending = undefined
        const binding = this.activeBindings(entry)[0]
        if (binding) this.hydrate(binding)
      }

      this.schedule()
    })

    router.onError(() => {
      this.transitioning = false
      this.pop = false
      this.schedule()
    })

    history.setup(router, () => this.write())
  }

  private prepareNavigation(to: RouteLocationNormalized, from: RouteLocationNormalized) {
    const redirected = to.redirectedFrom && this.navigations.get(to.redirectedFrom)
    const navigation: Navigation = redirected?.carriedTo === to.fullPath ? redirected : {
      incoming: { ...to.query },
      authoritative: this.epoch === 0 || this.pop
        || (to.path === from.path && Object.keys(to.query).length > 0)
    }

    this.navigations.set(to, navigation)
    if (navigation.authoritative || redirected?.carriedTo === to.fullPath) return

    // Повторная ссылка на текущую страницу не означает сброс её параметров.
    if (to.path !== from.path) return
    const query = { ...from.query }

    const target = { path: to.path, hash: to.hash, query }
    const fullPath = this.router.resolve(target).fullPath
    if (fullPath === to.fullPath) return

    navigation.carriedTo = fullPath
    this.navigations.set(to.redirectedFrom ?? to, navigation)
    return target
  }

  private isOwnWrite(to: RouteLocationNormalized) {
    return this.writing?.to === to.fullPath && !this.pop
  }

  isActive(owner: QueryOwner) {
    return owner.active && owner.enabled()
      && (!owner.record || this.router.currentRoute.value.matched.some(record => sameRecord(record, owner.record!)))
  }

  private activeBindings(entry: Entry) {
    return [...entry.bindings].filter(binding => this.isActive(binding.owner))
  }

  bind(owner: QueryOwner, name: string, definition: QueryParam, options: QueryWriteOptions): Binding {
    const label = definition.label ?? name
    const key = definition.key ?? label
    let entry = this.entries.get(key)

    if (entry) {
      if (entry.definition.type !== definition.type
        || entry.definition.serialize !== definition.serialize
        || entry.definition.deserialize !== definition.deserialize
        || encode(definition, defaultValue(definition)) !== encode(entry.definition, entry.defaultValue)) {
        throw new Error(`useQueryStorage: несовместимые определения ключа "${key}"`)
      }
    } else {
      entry = {
        key,
        definition,
        defaultValue: defaultValue(definition),
        value: ref(defaultValue(definition)),
        epoch: -1,
        bindings: new Set()
      }

      try {
        const saved = sessionStorage.getItem(storagePrefix + key)
        if (saved !== null) entry.value.value = decode(definition, JSON.parse(saved).value)
      } catch { /* При недоступном sessionStorage остаётся память вкладки. */ }

      const watched = entry
      this.scope.run(() => watch(watched.value, () => this.changed(watched), { deep: true, flush: 'sync' }))
      this.entries.set(key, entry)
    }

    const binding = { owner, entry, label, options: { ...options, ...definition } }
    entry.bindings.add(binding)
    owner.bindings.push(binding)
    this.labels.add(label)

    this.assertLabels()
    this.hydrate(binding)

    return binding
  }

  private assertLabels() {
    const labels = new Map<string, string>()

    for (const entry of this.entries.values()) {
      for (const binding of this.activeBindings(entry)) {
        const other = labels.get(binding.label)
        if (other !== undefined && other !== entry.key) {
          throw new Error(`useQueryStorage: label "${binding.label}" одновременно занят ключами "${other}" и "${entry.key}"`)
        }

        labels.set(binding.label, entry.key)
      }
    }
  }

  private hydrate(binding: Binding) {
    const { entry, label } = binding
    if (!this.isActive(binding.owner) || entry.epoch === this.epoch) return

    entry.epoch = this.epoch
    this.reading = true

    try {
      if (Object.hasOwn(this.incoming, label) || this.authoritative) {
        entry.value.value = decode(entry.definition, this.incoming[label])
      }

      this.persist(entry)
    } finally {
      this.reading = false
    }
  }

  private persist(entry: Entry) {
    try {
      sessionStorage.setItem(storagePrefix + entry.key, JSON.stringify({ value: queryValue(entry) }))
    } catch { /* Хранилище браузера может быть отключено или переполнено. */ }
  }

  private changed(entry: Entry) {
    if (this.reading) return

    this.persist(entry)

    const binding = this.override?.binding.entry === entry ? this.override.binding : this.activeBindings(entry)[0]
    if (!binding || !this.isActive(binding.owner)) return

    const options = this.override?.binding === binding ? this.override.options : binding.options
    entry.pending = {
      at: Date.now() + Math.max(0, options.debounce ?? 0),
      history: options.history ?? 'replace'
    }

    this.schedule()
  }

  set(binding: Binding, value: any, options = binding.options) {
    if (!this.isActive(binding.owner)) return

    this.override = { binding, options }

    try {
      binding.entry.value.value = value
    } finally {
      this.override = undefined
    }
  }

  patch(changes: { binding: Binding, value: any }[], options: QueryWriteOptions) {
    const debounce = options.debounce ?? Math.max(0, ...changes.map(({ binding }) => binding.options.debounce ?? 0))
    const history = options.history ?? (changes.some(({ binding }) => binding.options.history === 'push') ? 'push' : 'replace')
    const at = Date.now() + debounce

    for (const { binding, value } of changes) {
      this.set(binding, value, { history, debounce })

      // Одинаковый срок делает patch атомарным даже для параметров с разными debounce.
      if (binding.entry.pending) binding.entry.pending = { at, history }
    }

    this.schedule()
  }

  activate(owner: QueryOwner) {
    owner.active = true
    this.assertLabels()

    for (const binding of owner.bindings) {
      if (!this.activeBindings(binding.entry).length) binding.entry.pending = undefined
      this.hydrate(binding)
    }

    this.schedule()
  }

  deactivate(owner: QueryOwner, dispose = false) {
    owner.active = false

    for (const binding of owner.bindings) {
      if (dispose) binding.entry.bindings.delete(binding)
      if (!this.activeBindings(binding.entry).length) binding.entry.pending = undefined
    }

    this.schedule()
  }

  private schedule() {
    if (this.timer) clearTimeout(this.timer)
    this.history.schedule()
  }

  flush(bindings: Binding[]) {
    for (const { entry } of bindings) {
      if (entry.pending) entry.pending.at = 0
    }

    return this.history.flush()
  }

  private prepareWrite() {
    if (this.writing || this.transitioning) return
    if (this.timer) clearTimeout(this.timer)

    const route = this.router.currentRoute.value
    const query: LocationQueryRaw = { ...route.query }
    const activeLabels = new Set<string>()
    let history: 'push' | 'replace' = 'replace'
    let next = Infinity
    const now = Date.now()

    for (const entry of this.entries.values()) {
      const bindings = this.activeBindings(entry)
      if (!bindings.length) continue
      for (const { label } of bindings) activeLabels.add(label)

      if (entry.pending && entry.pending.at > now) {
        next = Math.min(next, entry.pending.at)
        continue
      }

      if (entry.pending?.history === 'push') history = 'push'
      entry.pending = undefined

      const value = queryValue(entry)
      for (const { label } of bindings) {
        if (value === undefined) delete query[label]
        else query[label] = value
      }
    }

    for (const label of this.labels) {
      if (!activeLabels.has(label)) delete query[label]
    }

    if (next !== Infinity) this.timer = setTimeout(() => this.schedule(), Math.max(0, next - Date.now()))

    const target = { path: route.path, hash: route.hash, query }
    const fullPath = this.router.resolve(target).fullPath
    if (fullPath === route.fullPath) return

    return { target, fullPath, history }
  }

  private write(): Promise<void> | undefined {
    const prepared = this.prepareWrite()
    if (!prepared) return

    const { target, fullPath, history } = prepared
    const epoch = this.epoch
    const writing = { to: fullPath }
    this.writing = writing
    let succeeded = false

    return this.router[history](target)
      .then(failure => {
        succeeded = !failure
      })
      .catch(error => {
        console.error('useQueryStorage: не удалось обновить URL', error)
      })
      .finally(() => {
        if (this.writing === writing) this.writing = undefined

        if (!succeeded && epoch === this.epoch && !this.transitioning) {
          // Отклонённую навигацию не повторяем бесконечно: возвращаем подтверждённые значения.
          this.reading = true

          try {
            for (const entry of this.entries.values()) {
              const binding = this.activeBindings(entry)[0]
              if (!binding || entry.pending) continue

              entry.value.value = decode(entry.definition, this.router.currentRoute.value.query[binding.label])
              this.persist(entry)
            }
          } finally {
            this.reading = false
          }
        }

        if (succeeded || epoch !== this.epoch || [...this.entries.values()].some(entry => entry.pending)) this.schedule()
      })
  }
}

export function setupQueryStorage(router: Router, history?: DeferredWebHistory) {
  let coordinator = coordinators.get(router)

  if (!coordinator) {
    if (!history) throw new Error('Вызовите setupQueryStorage(router, history) до использования useQueryStorage')
    coordinator = new QueryStorageCoordinator(router, history)
    coordinators.set(router, coordinator)
  }

  return coordinator
}
