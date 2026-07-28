import { ref } from 'vue'
import { useMutationObserver } from '@vueuse/core'

export function useClassState(element: HTMLElement, className: string) {
  const active = ref(element.classList.contains(className))

  useMutationObserver(element, () => {
    active.value = element.classList.contains(className)
  }, { attributes: true, attributeFilter: ['class'] })

  return active
}
