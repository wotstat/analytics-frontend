import { Ref, ComputedRef, watch, reactive, computed } from "vue";
import gsap from 'gsap'

export function useTweenCounter(value: Ref<number> | ComputedRef<number>, options?: {
  duration?: number,
  fixedValue?: number
}) {

  const tweened = reactive({
    number: 0
  })

  watch(value, n => {
    gsap.to(tweened, { duration: options?.duration ?? 0.5, number: n })
  })

  return computed(() => Number.parseFloat(tweened.number.toFixed(options?.fixedValue ?? 0)))
}