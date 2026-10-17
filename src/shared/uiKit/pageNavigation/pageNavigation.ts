import { computed, inject, onActivated, onDeactivated, onMounted, onScopeDispose, shallowRef, triggerRef, type Ref } from 'vue'
import { matchedRouteKey, useRouter, type RouteLocationNormalizedLoaded, type RouteRecordNormalized, type Router } from 'vue-router'

type MountedPage = {
  record: RouteRecordNormalized
  component: object
}

type PageNavigation = {
  mountedPages: Ref<Set<MountedPage>>
}

const asyncPages = new WeakSet<object>()
const navigations = new WeakMap<Router, PageNavigation>()

export function registerAsyncPage(component: object) {
  asyncPages.add(component)
}

export function setupPageNavigation(router: Router, paramsReady: Readonly<Ref<RouteLocationNormalizedLoaded | null>>) {
  const mountedPages = shallowRef(new Set<MountedPage>())
  navigations.set(router, { mountedPages })

  const readyRoute = computed(() => {
    const route = paramsReady.value
    if (!route || route !== router.currentRoute.value) return null

    for (const record of route.matched) {
      for (const component of Object.values(record.components ?? {})) {
        if (!asyncPages.has(component)) continue
        const mounted = [...mountedPages.value].some(page => page.component === component
          && (page.record.aliasOf ?? page.record) === (record.aliasOf ?? record))
        if (!mounted) return null
      }
    }

    return route
  })

  return { readyRoute }
}

export function useAsyncPageMounted(component: object) {
  const navigation = navigations.get(useRouter())
  if (!navigation) throw new Error('setupPageNavigation must be called before mounting an async page')

  const record = inject(matchedRouteKey, undefined)?.value
  if (!record) throw new Error('An async page must be rendered by RouterView')

  const page = { record, component }

  const activate = () => {
    if (navigation.mountedPages.value.has(page)) return
    navigation.mountedPages.value.add(page)
    triggerRef(navigation.mountedPages)
  }
  const deactivate = () => {
    if (!navigation.mountedPages.value.delete(page)) return
    triggerRef(navigation.mountedPages)
  }

  onMounted(activate)
  onActivated(activate)
  onDeactivated(deactivate)
  onScopeDispose(deactivate)
}
