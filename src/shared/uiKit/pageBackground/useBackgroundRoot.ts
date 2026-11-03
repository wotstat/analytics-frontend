import { nextTick, watch, type Ref } from 'vue'
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router'
import { provideBackgroundController } from './useBackground'

export function useBackgroundRoot(readyRoute: Readonly<Ref<RouteLocationNormalizedLoaded | null>>) {
  const route = useRoute()
  const controller = provideBackgroundController()

  watch(() => route.matched, (current, previous) => {
    if (current.length === previous.length && current.every((record, index) =>
      (record.aliasOf ?? record) === (previous[index].aliasOf ?? previous[index]))) return
    controller.beginHandoff()
  }, { flush: 'sync' })

  watch(readyRoute, ready => {
    if (!ready) return
    void nextTick(() => {
      if (readyRoute.value === ready) controller.finishHandoff()
    })
  }, { flush: 'post' })

  return controller
}
