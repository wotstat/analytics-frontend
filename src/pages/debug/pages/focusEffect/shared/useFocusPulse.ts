import { MaybeRefOrGetter, onUnmounted, ref, toValue, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { showFocusEffect } from '@/shared/uiKit/focusEffect/focusEffect'
import { clearFocusEffects, PULSE_INTERVAL_MS } from './focusEffectControl'

export function useFocusPulse(target: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  const pulse = ref(false)

  const { pause, resume } = useIntervalFn(fire, PULSE_INTERVAL_MS, { immediate: false })

  function fire() {
    const element = toValue(target)
    if (element) showFocusEffect(element)
  }

  watch(pulse, value => {
    if (!value) return pause()
    fire()
    resume()
  })

  onUnmounted(() => {
    pause()
    clearFocusEffects()
  })

  return { pulse, fire }
}
