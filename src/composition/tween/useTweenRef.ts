import { reactive, ref, Ref, watch } from 'vue'
import { easing } from './easing'

export type TweenOptions = {
  duration: number
  easing?: keyof typeof easing | null
  minStep?: number
}

const defaultOptions = {
  duration: 1000,
  easing: 'out-quad',
  minStep: 1
} satisfies TweenOptions

export function useTweenRef(value: Ref<number>, options: TweenOptions = defaultOptions) {
  const tweenRef = ref(value.value)

  let tweenTargetValue = tweenRef.value
  let tweenStartValue = tweenRef.value
  let tweenStartTime: number

  let handler: number = -1
  const ease = options.easing === null ? (x: number) => x : easing[options.easing ?? defaultOptions.easing]

  function doTween(to: number) {
    if (tweenRef.value == to) return handler = -1
    if (Math.abs(tweenRef.value - to) <= (options.minStep ?? defaultOptions.minStep)) {
      tweenRef.value = to
      return handler = -1
    }

    tweenStartValue = tweenRef.value
    tweenTargetValue = to
    tweenStartTime = performance.now()

    function tween() {
      if (tweenRef.value == tweenTargetValue) return handler = -1

      if (options.duration == 0) {
        tweenRef.value = tweenTargetValue
        return handler = -1
      }

      const elapsed = performance.now() - tweenStartTime
      const progress = elapsed / options.duration


      if (progress >= 1) {
        tweenRef.value = tweenTargetValue
        return handler = -1
      } else {
        tweenRef.value = tweenStartValue + (tweenTargetValue - tweenStartValue) * ease(progress)
      }

      requestAnimationFrame(tween)
    }

    if (handler == -1) handler = requestAnimationFrame(tween)
  }

  watch(value, (newValue) => {
    doTween(newValue)
  })

  return tweenRef
}

export function useTweenComputed(effect: () => number, options: TweenOptions = defaultOptions) {
  const value = ref(effect())
  const tweenRef = useTweenRef(value, options)

  watch(effect, (newValue) => {
    value.value = newValue
  })

  return tweenRef
}

