import {
  shallowRef,
  readonly,
  watch,
  onScopeDispose,
  type Ref,
} from 'vue'

export function refThrottledCheck<T>(
  value: Ref<T>,
  delay: (value: T) => number,
  trailing: boolean = true,
  leading: boolean = false,
): Readonly<Ref<T>> {
  const throttled = shallowRef(value.value) as Ref<T>

  let timer: ReturnType<typeof setTimeout> | undefined
  let lastExecution = 0
  let pendingValue = value.value

  const clearTimer = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  const execute = (newValue: T) => {
    clearTimer()
    throttled.value = newValue
    lastExecution = Date.now()
  }

  const schedule = (newValue: T, wait: number) => {
    if (!trailing) return

    pendingValue = newValue
    clearTimer()

    timer = setTimeout(() => {
      execute(pendingValue)
    }, wait)
  }

  const stop = watch(value, (newValue) => {
    // Important: recalculated on every value change
    const currentDelay = Math.max(0, delay(newValue))
    const now = Date.now()

    if (lastExecution === 0) {
      if (leading) {
        execute(newValue)
      } else {
        lastExecution = now
        schedule(newValue, currentDelay)
      }

      return
    }

    const elapsed = now - lastExecution
    const remaining = currentDelay - elapsed

    if (remaining <= 0) {
      execute(newValue)
    } else {
      schedule(newValue, remaining)
    }
  })

  onScopeDispose(() => {
    clearTimer()
    stop()
  })

  return readonly(throttled) as Readonly<Ref<T>>
}