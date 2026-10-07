import { nextTick } from 'vue'
import type { HistoryState, RouteLocationNormalized, Router, RouterHistory } from 'vue-router'

type Snapshot = { location: string, state: HistoryState }
type Write = Snapshot & { previous?: Snapshot }
type Listener = Parameters<RouterHistory['listen']>[0]

export type DeferredWebHistory = RouterHistory & {
  setup: (router: Router, synchronize: () => void | Promise<void>) => void
  schedule: () => void
  flush: () => Promise<void>
}

// Формат history.state совместим с Vue Router: position нужен для отмены pop,
// back/forward — для переходов, scroll — для восстановления прокрутки.
export function createDeferredWebHistory(base?: string): DeferredWebHistory {
  base = (base || document.querySelector('base')?.getAttribute('href') || '/')
    .replace(/^\w+:\/\/[^/]+/, '')
  if (base[0] !== '/' && base[0] !== '#') base = '/' + base
  base = base.replace(/\/$/, '')

  const normalizedBase = base
  const native = window.history
  const listeners = new Set<Listener>()
  const cleanups: (() => void)[] = []
  const waiters = new Set<{ resolve: () => void, reject: (error: unknown) => void }>()
  const writes: Write[] = []

  let current: Snapshot = { location: readLocation(), state: native.state }
  let committedPosition = Number(current.state?.position ?? native.length - 1)
  let pausedFrom: string | undefined
  let navigation: RouteLocationNormalized | undefined
  let requests = 0
  let externalRequests = 0
  let awaitingPop: string | undefined
  let synchronize: (() => void | Promise<void>) | undefined
  let synchronizing = false
  let running: Promise<void> | undefined
  let dirty = false
  let destroyed = false

  function navigating() {
    return !!navigation || requests > 0 || !!awaitingPop
  }

  function readLocation() {
    const { pathname, search, hash } = window.location
    const hashIndex = normalizedBase.indexOf('#')

    if (hashIndex >= 0) {
      const prefix = normalizedBase.slice(hashIndex)
      const path = hash.slice(hash.startsWith(prefix) ? prefix.length : 1)
      return path.startsWith('/') ? path : '/' + path
    }

    const path = pathname.toLowerCase().startsWith(normalizedBase.toLowerCase())
      ? pathname.slice(normalizedBase.length) || '/' : pathname
    return path + search + hash
  }

  function browserUrl(location: string) {
    const hashIndex = normalizedBase.indexOf('#')
    if (hashIndex < 0) return window.location.origin + normalizedBase + location

    const prefix = window.location.host && document.querySelector('base')
      ? normalizedBase : normalizedBase.slice(hashIndex)
    return prefix + location
  }

  function write(snapshot: Snapshot, replace: boolean) {
    const url = browserUrl(snapshot.location)

    try {
      native[replace ? 'replaceState' : 'pushState'](snapshot.state, '', url)
    } catch (error) {
      console.error('Не удалось записать историю навигации', error)
      window.location[replace ? 'replace' : 'assign'](url)
    }
  }

  if (!current.state) {
    current.state = {
      back: null, current: current.location, forward: null,
      replaced: true, position: committedPosition, scroll: null
    }
    write(current, true)
  }

  function commit() {
    for (const pending of writes) {
      if (pending.previous) {
        write({
          location: pending.previous.location,
          state: { ...native.state, ...pending.previous.state, forward: pending.location }
        }, true)
      }

      write(pending, !pending.previous)
    }

    writes.length = 0
    committedPosition = Number(current.state.position)
  }

  async function run() {
    while (dirty && !navigating() && !destroyed) {
      // Ждём только обновление Vue: setup, mount/unmount и активацию KeepAlive.
      await nextTick()
      if (navigating() || destroyed) return

      dirty = false
      let update: void | Promise<void>

      try {
        synchronizing = true
        update = synchronize?.()
      } finally {
        synchronizing = false
      }

      if (update) await update
      if (navigating() || destroyed) return

      // Применение query могло обновить компоненты и зарегистрировать новых владельцев.
      if (dirty) continue

      commit()
      for (const waiter of waiters) waiter.resolve()
      waiters.clear()
    }
  }

  function schedule() {
    if (destroyed) return
    dirty = true
    if (running || navigating()) return

    running = run().catch(error => {
      dirty = false
      for (const waiter of waiters) waiter.reject(error)
      waiters.clear()
      console.error('Не удалось синхронизировать историю навигации', error)
    }).finally(() => {
      running = undefined
      if (dirty && !navigating() && !destroyed) schedule()
    })
  }

  function flush() {
    if (destroyed) return Promise.resolve()

    return new Promise<void>((resolve, reject) => {
      waiters.add({ resolve, reject })
      schedule()
    })
  }

  function onPopState(event: PopStateEvent) {
    const from = current.location
    const fromPosition = committedPosition
    writes.length = 0
    current = {
      location: readLocation(),
      state: event.state ?? {
        back: null, current: readLocation(), forward: null,
        replaced: true, position: native.length - 1, scroll: null
      }
    }
    committedPosition = Number(current.state.position)
    if (!event.state) write(current, true)

    if (pausedFrom === from) {
      pausedFrom = undefined
      return
    }

    const delta = event.state ? committedPosition - fromPosition : 0
    awaitingPop = current.location
    for (const listener of listeners) {
      listener(current.location, from, {
        delta,
        type: 'pop' as Parameters<Listener>[2]['type'],
        direction: (delta > 0 ? 'forward' : delta < 0 ? 'back' : '') as Parameters<Listener>[2]['direction']
      })
    }
  }

  function saveScroll() {
    if (document.visibilityState !== 'hidden') return
    commit()
    current.state = { ...native.state, scroll: { left: window.scrollX, top: window.scrollY } }
    write(current, true)
  }

  window.addEventListener('popstate', onPopState)
  window.addEventListener('pagehide', saveScroll)
  document.addEventListener('visibilitychange', saveScroll)

  return {
    base: normalizedBase,
    get location() { return current.location },
    get state() { return current.state },
    createHref: location => normalizedBase.replace(/^[^#]+#/, '#') + location,

    push(location, data) {
      const previous: Snapshot = {
        location: current.location,
        state: { ...current.state, scroll: { left: window.scrollX, top: window.scrollY } }
      }
      current = {
        location,
        state: {
          back: previous.location, current: location, forward: null,
          replaced: false, position: Number(previous.state.position) + 1, scroll: null, ...data
        }
      }
      writes.push({ ...current, previous })
    },

    replace(location, data) {
      current = {
        location,
        state: {
          ...native.state, ...current.state,
          current: location, replaced: true, scroll: null, ...data, position: current.state.position
        }
      }

      // replace уточняет последнюю ожидающую запись, сохраняя исходный push.
      const last = writes.at(-1)
      if (last) Object.assign(last, current)
      else writes.push({ ...current })
    },

    go(delta, triggerListeners = true) {
      const go = () => {
        if (!triggerListeners) pausedFrom = current.location
        native.go(delta)
      }

      if (writes.length) void flush().then(go)
      else go()
    },

    listen(callback) {
      listeners.add(callback)
      return () => { listeners.delete(callback) }
    },

    setup(router, prepare) {
      if (synchronize) throw new Error('DeferredWebHistory уже подключена к роутеру')
      synchronize = prepare

      // beforeEach вызывается асинхронно. Отмечаем вызов push/replace сразу,
      // чтобы пересчёт query не отменил уже начавшийся пользовательский переход.
      const originalPush = router.push
      const originalReplace = router.replace
      const track = (navigate: () => ReturnType<Router['push']>) => {
        const internal = synchronizing
        requests++
        if (!internal) externalRequests++

        try {
          return navigate().finally(() => {
            requests--
            if (!internal) externalRequests--
            schedule()
          }).then(async failure => {
            // Компоненты переключились раньше. Публичный promise завершаем с готовым URL;
            // служебная запись и вложенный переход не должны ждать сами себя.
            if (!internal && externalRequests === 0) await flush()
            return failure
          })
        } catch (error) {
          requests--
          if (!internal) externalRequests--
          schedule()
          throw error
        }
      }
      const push: Router['push'] = to => track(() => originalPush(to))
      const replace: Router['replace'] = to => track(() => originalReplace(to))
      router.push = push
      router.replace = replace
      cleanups.push(() => {
        if (router.push === push) router.push = originalPush
        if (router.replace === replace) router.replace = originalReplace
      })

      cleanups.push(router.beforeEach(to => {
        navigation = to
        awaitingPop = undefined
      }))
      cleanups.push(router.afterEach(to => {
        if (navigation === to) navigation = undefined
        if (awaitingPop === to.fullPath || awaitingPop === to.redirectedFrom?.fullPath) awaitingPop = undefined
        schedule()
      }))
      cleanups.push(router.onError((_error, to) => {
        if (navigation === to) navigation = undefined
        if (awaitingPop === to.fullPath || awaitingPop === to.redirectedFrom?.fullPath) awaitingPop = undefined
        schedule()
      }))
    },

    schedule,
    flush,

    destroy() {
      destroyed = true
      writes.length = 0
      listeners.clear()
      for (const cleanup of cleanups) cleanup()
      for (const waiter of waiters) waiter.resolve()
      waiters.clear()
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('pagehide', saveScroll)
      document.removeEventListener('visibilitychange', saveScroll)
    }
  }
}
