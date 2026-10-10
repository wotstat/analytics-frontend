import { effectScope, ref, watch, type Ref } from 'vue'
import type { LocationQuery, LocationQueryRaw, RouteLocation, RouteLocationNormalized, RouteRecordNormalized, Router } from 'vue-router'
import type { DeferredWebHistory } from './createDeferredWebHistory'
import type { QueryParam, QueryWriteOptions } from '../queryStorageTypes'
import { defaultValue, encode, decode, contextDefinitions, assertContext, sameDefinition, type Encoded, type QuerySnapshot } from './queryParamUtils'

type Navigation = {
  incoming: LocationQuery
  authoritative: boolean
  carriedTo?: string
}

type Entry = {
  key: string
  coordinator: QueryStorageCoordinator
  definition: QueryParam
  definitionGeneration: number
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
let syncEntries: Set<Entry> | undefined
let definitionGeneration = 0

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => { definitionGeneration++ })
}

// Контекст действует только в текущем стеке; вложенные вызовы завершаются вместе с внешним.
export function queryStorageSync<T>(callback: () => T): T {
  if (syncEntries) return callback()

  const entries = new Set<Entry>()
  syncEntries = entries

  try {
    return callback()
  } finally {
    syncEntries = undefined

    for (const entry of entries) entry.coordinator.expedite([entry])
  }
}

function queryValue(entry: Entry, query?: QuerySnapshot, model = entry.value.value): Encoded {
  const value = encode(entry.definition, model, query)
  if (value === encode(entry.definition, entry.defaultValue, query)) return undefined
  return value
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
    let navigation = redirected

    if (!navigation || navigation.carriedTo !== to.fullPath) {
      navigation = {
        incoming: { ...to.query },
        authoritative: this.epoch === 0 || this.pop
          || (to.path === from.path && Object.keys(to.query).length > 0)
      }
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

  private getEntry(key: string, definition: QueryParam): Entry {
    const existing = this.entries.get(key)

    if (existing) {
      // HMR пересоздаёт функции кодека; refs и память остаются у прежней записи.
      if (import.meta.hot && existing.definitionGeneration !== definitionGeneration) {
        existing.definition = definition
        existing.defaultValue = defaultValue(definition)
        existing.definitionGeneration = definitionGeneration
        return existing
      }

      if (!sameDefinition(existing.definition, definition)) {
        throw new Error(`useQueryStorage: incompatible definitions for key "${key}"`)
      }

      return existing
    }

    const entry: Entry = {
      key,
      coordinator: this,
      definition,
      definitionGeneration,
      defaultValue: defaultValue(definition),
      value: ref(defaultValue(definition)),
      epoch: -1,
      bindings: new Set()
    }

    try {
      const saved = sessionStorage.getItem(storagePrefix + key)
      if (saved !== null) entry.value.value = decode(definition, JSON.parse(saved).value)
    } catch { /* При недоступном sessionStorage остаётся память вкладки. */ }

    this.scope.run(() => {
      watch(entry.value, () => this.changed(entry), { deep: true, flush: 'sync' })
    })
    this.entries.set(key, entry)

    return entry
  }

  bind(owner: QueryOwner, name: string, definition: QueryParam, options: QueryWriteOptions): Binding {
    const label = definition.label ?? name
    const key = definition.key ?? label
    assertContext(definition, new Set([label]))

    const entry = this.getEntry(key, definition)
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
          throw new Error(`useQueryStorage: label "${binding.label}" is used by both keys "${other}" and "${entry.key}"`)
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
        entry.value.value = decode(entry.definition, this.incoming[label], this.incoming)
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

    let binding = this.override?.binding
    if (binding?.entry !== entry) binding = this.activeBindings(entry)[0]
    if (!binding || !this.isActive(binding.owner)) return

    let options = binding.options
    if (this.override?.binding === binding) options = this.override.options

    entry.pending = {
      at: Date.now() + Math.max(0, options.debounce ?? 0),
      history: options.history ?? 'replace'
    }

    syncEntries?.add(entry)
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
    let history = options.history
    if (history === undefined) {
      const pushes = changes.some(({ binding }) => binding.options.history === 'push')
      history = pushes ? 'push' : 'replace'
    }

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

  expedite(entries: Entry[]) {
    const related = new Set(entries)
    const active = new Map<string, Entry>()

    for (const entry of this.entries.values()) {
      for (const binding of this.activeBindings(entry)) active.set(binding.label, entry)
    }

    let previousSize = -1
    while (previousSize !== related.size) {
      previousSize = related.size

      for (const entry of new Set(active.values())) {
        for (const definition of contextDefinitions(entry.definition)) {
          const parent = active.get(definition.label!)
          if (parent && (related.has(entry) || related.has(parent))) {
            related.add(entry)
            related.add(parent)
          }
        }
      }
    }

    for (const entry of related) if (entry.pending) entry.pending.at = 0
  }

  flush(bindings: Binding[]) {
    this.expedite(bindings.map(binding => binding.entry))
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

    const active = new Map<Entry, Binding[]>()
    const byLabel = new Map<string, Entry>()

    for (const entry of this.entries.values()) {
      const bindings = this.activeBindings(entry)
      if (!bindings.length) continue

      active.set(entry, bindings)
      for (const { label } of bindings) {
        activeLabels.add(label)
        byLabel.set(label, entry)
      }
    }

    // Удаление владельцев тоже меняет контекст оставшихся параметров.
    for (const label of this.labels) {
      if (!activeLabels.has(label)) delete query[label]
    }

    const dependencies = new Map<Entry, Set<Entry>>()
    const neighbours = new Map([...active.keys()].map(entry => [entry, new Set<Entry>()]))

    for (const entry of active.keys()) {
      const parents = new Set<Entry>()

      for (const definition of contextDefinitions(entry.definition)) {
        const parent = byLabel.get(definition.label!)
        if (!parent) continue

        if (!sameDefinition(parent.definition, definition)) {
          throw new Error(`useQueryStorage: incompatible context definition for "${definition.label}"`)
        }

        parents.add(parent)
        neighbours.get(entry)!.add(parent)
        neighbours.get(parent)!.add(entry)
      }

      dependencies.set(entry, parents)
    }

    // Зависимые параметры образуют одну группу записи с общим сроком debounce.
    const blocked = new Set<Entry>()
    const grouped = new Set<Entry>()

    for (const entry of active.keys()) {
      if (grouped.has(entry)) continue

      const group: Entry[] = []
      const collect = (value: Entry) => {
        if (grouped.has(value)) return
        grouped.add(value)
        group.push(value)
        for (const neighbour of neighbours.get(value)!) collect(neighbour)
      }

      collect(entry)

      const at = Math.max(...group.map(value => value.pending?.at ?? 0))
      if (at > now) {
        next = Math.min(next, at)
        for (const value of group) blocked.add(value)
      }
    }

    const written = new Set<Entry>()
    const visiting = new Set<Entry>()

    const writeEntry = (entry: Entry) => {
      if (written.has(entry)) return
      if (visiting.has(entry)) throw new Error('useQueryStorage: circular context dependency')

      visiting.add(entry)
      for (const parent of dependencies.get(entry)!) writeEntry(parent)
      visiting.delete(entry)
      written.add(entry)

      const bindings = active.get(entry)!
      let model = entry.value.value

      if (blocked.has(entry)) {
        if (!entry.definition.context) return
        model = decode(entry.definition, route.query[bindings[0].label], route.query)
      } else {
        if (entry.pending?.history === 'push') history = 'push'
        entry.pending = undefined
      }

      const value = queryValue(entry, query, model)
      for (const { label } of bindings) {
        if (value === undefined) {
          delete query[label]
          continue
        }

        query[label] = value
      }
    }

    for (const entry of active.keys()) writeEntry(entry)

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
        console.error('useQueryStorage: failed to update URL', error)
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

              entry.value.value = decode(entry.definition, this.router.currentRoute.value.query[binding.label], this.router.currentRoute.value.query)
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
    if (!history) throw new Error('Call setupQueryStorage(router, history) before using useQueryStorage')
    coordinator = new QueryStorageCoordinator(router, history)
    coordinators.set(router, coordinator)
  }

  return coordinator
}
