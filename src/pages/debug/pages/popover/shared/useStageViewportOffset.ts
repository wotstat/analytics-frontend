import { getViewportRect } from '@/shared/uiKit/popover/utils'
import { useRafFn } from '@vueuse/core'
import { ref, watch, type Ref } from 'vue'

type Offset = { top: number, left: number, right: number, bottom: number }

export function useStageViewportOffset(element: Ref<HTMLElement | null>, enabled: Ref<boolean>) {
  const offset = ref<Offset>({ top: 0, left: 0, right: 0, bottom: 0 })

  const { pause, resume } = useRafFn(update, { immediate: false })

  function update() {
    const el = element.value
    if (!el) return

    const stage = el.getBoundingClientRect()
    const viewport = getViewportRect()

    const next: Offset = {
      top: Math.max(0, stage.top - viewport.top),
      left: Math.max(0, stage.left - viewport.left),
      right: Math.max(0, viewport.right - stage.right),
      bottom: Math.max(0, viewport.bottom - stage.bottom),
    }

    const current = offset.value
    if (next.top === current.top && next.left === current.left
      && next.right === current.right && next.bottom === current.bottom) return

    offset.value = next
  }

  watch(enabled, value => {
    if (!value) {
      pause()
      return
    }

    update()
    resume()
  }, { immediate: true })

  return offset
}
