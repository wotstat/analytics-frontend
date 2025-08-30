import { onUnmounted, reactive, ref, Ref, watch } from 'vue'
import { easing } from './easing'


/**
 * Options for configuring a tween animation.
 *
 * @property duration - The total duration of the tween in milliseconds.
 * @property easing - The name of the easing function to use for the tween. Should be a key from the `easing` object, or `null` for no easing.
 * @property minStep - The minimum step value for the tween animation. Optional.
 */
export type TweenOptions = {
  duration?: number
  easing?: keyof typeof easing | null
  minStep?: number
}

const defaultOptions = {
  duration: 1000,
  easing: 'out-quad',
  minStep: 1
} satisfies TweenOptions

export class Tween {

  private getValue: () => number
  private setValue: (value: number) => void

  constructor(options: {
    get: () => number
    set: (value: number) => void
  }) {
    this.getValue = options.get
    this.setValue = options.set
  }


  private animating: boolean = false
  private tweenTargetValue = 0
  private tweenStartValue = 0
  private tweenStartTime = 0

  to(value: number, options?: TweenOptions) {

    if (this.animating && this.tweenTargetValue === value) return

    const fromValue = this.getValue()
    const duration = options?.duration ?? defaultOptions.duration
    const minStep = options?.minStep ?? defaultOptions.minStep

    if (fromValue === value) {
      this.animating = false
      return
    }

    if (Math.abs(fromValue - value) <= minStep) {
      this.setValue(value)
      this.animating = false
      return
    }

    const ease = options?.easing === null ? (x: number) => x : easing[options?.easing ?? defaultOptions.easing]

    const animate = () => {
      if (!this.animating) return

      const time = performance.now()

      if (this.tweenStartTime === null) this.tweenStartTime = time
      const elapsed = time - this.tweenStartTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = ease(progress)

      this.setValue(this.tweenStartValue! + (this.tweenTargetValue! - this.tweenStartValue!) * eased)

      if (progress < 1) requestAnimationFrame(animate)
      else this.animating = false
    }

    this.tweenStartValue = fromValue
    this.tweenTargetValue = value
    this.tweenStartTime = performance.now()

    if (!this.animating) {
      this.animating = true
      requestAnimationFrame(animate)
    }
  }

  dispose() {
    this.animating = false
  }
}


export function useTweenRef(value: Ref<number>, options: TweenOptions = defaultOptions) {
  const tweenRef = ref(value.value)

  const tween = new Tween({
    get: () => tweenRef.value,
    set: (value) => tweenRef.value = value
  })

  watch(value, (newValue) => tween.to(newValue, options))

  onUnmounted(() => tween.dispose())

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

