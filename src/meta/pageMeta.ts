import { inject, onActivated, onDeactivated, onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { matchedRouteKey, useRouter, type RouteLocationNormalizedLoaded, type RouteRecordNormalized, type Router } from 'vue-router'
import { matchMetaDefinition } from './definitions'
import type { MetaTags } from './utils'

export type PageMetaOverride = Partial<Pick<MetaTags, 'title' | 'description' | 'keywords'>>

type Source = {
  record?: RouteRecordNormalized
  active: boolean
  read: () => PageMetaOverride | null
}

type PageMetaManager = {
  sources: Set<Source>
  schedule: () => void
}

const managers = new WeakMap<Router, PageMetaManager>()

export function setupPageMeta(router: Router, readyRoute: Readonly<Ref<RouteLocationNormalizedLoaded | null>>) {
  const revision = ref(0)
  const sources = new Set<Source>()

  const update = () => {
    const route = readyRoute.value
    if (!route || route !== router.currentRoute.value) return
    const url = new URL(route.fullPath, window.location.origin)
    const definition = matchMetaDefinition(url)
    const context = Object.fromEntries(Object.keys(definition.contexts ?? {}).map(key => [key, undefined]))
    const base = typeof definition.meta === 'function' ? definition.meta(url, context) : definition.meta
    const meta: MetaTags = { ...base }

    const active = [...sources].flatMap(source => {
      if (!source.active) return []
      if (!source.record) return [{ source, depth: -1 }]
      const record = source.record.aliasOf ?? source.record
      const depth = route.matched.findIndex(item => (item.aliasOf ?? item) === record)
      return depth < 0 ? [] : [{ source, depth }]
    }).sort((a, b) => a.depth - b.depth)

    for (const { source } of active) {
      const override = source.read()
      if (override === null) return
      for (const name of ['title', 'description', 'keywords'] as const) {
        const value = override[name]
        if (value !== undefined) meta[name] = value
      }
    }

    if (document.title !== meta.title) document.title = meta.title

    for (const name of ['description', 'keywords'] as const) {
      let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.name = name
        document.head.appendChild(tag)
      }
      const content = meta[name] ?? ''
      if (tag.content !== content) tag.content = content
    }
  }

  const schedule = () => {
    revision.value++
  }

  managers.set(router, { sources, schedule })
  watch([readyRoute, revision], update, { immediate: true, flush: 'post' })
}

export function usePageMeta(meta: MaybeRefOrGetter<PageMetaOverride | null>) {
  const router = useRouter()
  const manager = managers.get(router)
  if (!manager) throw new Error('setupPageMeta must be called before usePageMeta')

  const source: Source = {
    record: inject(matchedRouteKey, undefined)?.value,
    active: true,
    read: () => toValue(meta),
  }

  manager.sources.add(source)
  watch(source.read, manager.schedule, { deep: true, immediate: true })

  onActivated(() => {
    source.active = true
    manager.schedule()
  })
  onDeactivated(() => {
    source.active = false
    manager.schedule()
  })
  onScopeDispose(() => {
    manager.sources.delete(source)
    manager.schedule()
  })
}
