import { computed, shallowReactive, shallowRef, watch, type WritableComputedRef } from 'vue'

// Селекторы меняют Set на месте; модель страницы получает новые массивы.
export function useBadgeSelection<T extends string>(model: WritableComputedRef<T[]>) {
  const selected = shallowRef<Set<T>>(shallowReactive(new Set(model.value)))
  const matches = (values: T[], selection: Set<T>) =>
    values.length === selection.size && values.every(value => selection.has(value))

  watch(model, values => {
    if (!matches(values, selected.value)) selected.value = shallowReactive(new Set(values))
  }, { deep: true })

  watch(selected, selection => {
    if (!matches(model.value, selection)) model.value = [...selection]
  }, { deep: true })

  return computed({
    get: () => selected.value,
    set: (selection: Set<T>) => selected.value = shallowReactive(selection)
  })
}
