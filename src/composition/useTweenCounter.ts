// OLD VARIANT. 
// TODO: Replace to ./tween


import { Ref, ComputedRef, watch, reactive, computed } from "vue";
import gsap from 'gsap'

export function useTweenCounter<T extends number | number[]>(value: Ref<T> | ComputedRef<T>, options?: {
  duration?: number,
  fixedValue?: number,
  enabled?: Ref<boolean> | ComputedRef<boolean>
}) {

  const isArray = Array.isArray(value.value)

  const tweened = isArray ?
    reactive(new Array(value.value.length).fill(0).map(t => ({ value: 0 }))) :
    reactive({ value: value.value })

  function startTween(target: T) {
    if (Array.isArray(tweened) && Array.isArray(target)) {
      for (let i = 0; i < target.length; i++) {
        gsap.to(tweened[i], { duration: options?.duration ?? 0.5, value: target[i] })
      }
    } else {
      gsap.to(tweened, { duration: options?.duration ?? 0.5, value: target })
    }
  }

  if (options?.enabled === undefined) watch(value, n => startTween(n), { immediate: true })
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

  return computed(() => {

    if (Array.isArray(tweened))
      return tweened.map(t => Number.parseFloat(t.value.toFixed(options?.fixedValue ?? 0)))

    if (typeof tweened.value === 'number')
      return Number.parseFloat((tweened.value as number).toFixed(options?.fixedValue ?? 0))

    return tweened.value
  }) as ComputedRef<T>
}