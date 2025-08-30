import { MaybeElementRef, useMutationObserver, useResizeObserver } from '@vueuse/core'
import { MaybeRefOrGetter, onUnmounted, ref, toValue } from 'vue'


export function useHasScroll(element: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  const hasScrollX = ref(false)
  const hasScrollY = ref(false)

  function checkScroll() {
    const el = toValue(element)

    if (el) {
      hasScrollX.value = el.scrollWidth > el.clientWidth
      hasScrollY.value = el.scrollHeight > el.clientHeight
    } else {
      hasScrollX.value = false
      hasScrollY.value = false
    }
  }
  useMutationObserver(element as MaybeElementRef, checkScroll, { attributes: true, childList: true, subtree: true })
  useResizeObserver(element as MaybeElementRef, checkScroll)

  onUnmounted(() => {
    hasScrollX.value = false
    hasScrollY.value = false
  })

  return { hasScrollX, hasScrollY }
}