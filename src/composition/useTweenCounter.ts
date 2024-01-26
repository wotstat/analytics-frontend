import { Ref, ComputedRef, watch, reactive, computed } from "vue";
import gsap from 'gsap'

export function useTweenCounter(value: Ref<number> | ComputedRef<number>, options?: {
  duration?: number,
  fixedValue?: number,
  enabled?: Ref<boolean> | ComputedRef<boolean>
}) {

  const tweened = reactive({
    number: 0
  })

  function startTween(target: number) {
    gsap.to(tweened, { duration: options?.duration ?? 0.5, number: target })
  }

  if (options?.enabled === undefined) watch(value, n => startTween(n))
  else {
    const enabled = options.enabled

    watch(value, n => {
      if (!enabled.value) return
      startTween(n)
    })

    watch(enabled, n => {
      if (!n) return
      setTimeout(() => startTween(value.value), 100);
    })
  }

  return computed(() => Number.parseFloat(tweened.number.toFixed(options?.fixedValue ?? 0)))
}