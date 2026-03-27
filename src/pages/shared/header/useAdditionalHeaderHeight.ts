import { syncRefs, useElementBounding } from '@vueuse/core'
import { computed, onUnmounted, Ref, ref } from 'vue'


const additionalHeaderHeight = ref(0)
export const headerHeight = ref(0)

export function useAdditionalHeaderHeight(readonly = false) {
  if (!readonly) onUnmounted(() => additionalHeaderHeight.value = 0)
  return { additionalHeaderHeight }
}

export function useDefaultHeaderHeight(header: Ref<HTMLElement | null>) {
  const { height } = useElementBounding(header)
  syncRefs(height, headerHeight)
}

export const headerOffset = computed(() => headerHeight.value + additionalHeaderHeight.value)