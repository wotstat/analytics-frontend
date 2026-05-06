import {
  shallowRef,
  readonly,
  watch,
  onScopeDispose,
  type Ref,
} from 'vue'

export function refDebouncedCheck<T>(
  value: Ref<T>,
  delay: (value: T) => number,
  trailing: boolean = true,
  leading: boolean = false,
): Readonly<Ref<T>> {
  const debounced = shallowRef(value.value) as Ref<T>

  let timer: ReturnType<typeof setTimeout> | undefined
  let pendingValue = value.value
  let hasLeadingExecuted = false

  const clearTimer = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  const execute = (newValue: T) => {
    debounced.value = newValue
  }

  const stop = watch(value, (newValue) => {
    // Important: recalculated on every value change
    const currentDelay = Math.max(0, delay(newValue))

    pendingValue = newValue

    const shouldExecuteLeading = leading && !hasLeadingExecuted

    if (shouldExecuteLeading) {
      execute(newValue)
      hasLeadingExecuted = true
    }

    clearTimer()

    timer = setTimeout(() => {
      timer = undefined
      hasLeadingExecuted = false

      if (trailing) {
        execute(pendingValue)
      }
    }, currentDelay)
  })

  onScopeDispose(() => {
    clearTimer()
    stop()
  })

  return readonly(debounced) as Readonly<Ref<T>>
}