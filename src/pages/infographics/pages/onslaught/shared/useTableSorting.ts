import { computed, ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import type { ComposableTableColumn, ComposableTableKey } from '@/shared/ui/composableTable/types'

type Value = number | string | { sortKey: number | string }
type TableRow = { key: ComposableTableKey, index: number, values: Value[] }

// Правила прежних таблиц Натиска, включая дополнительные ключи при равных значениях.
export function useTableSorting(data: MaybeRefOrGetter<Value[][]>, options: {
  rowKey: (index: number) => ComposableTableKey
  defaultOrderBy?: MaybeRefOrGetter<number>
  orderBy?: Ref<number>
  orderDirection?: Ref<'asc' | 'desc'>
}) {
  const orderBy = options.orderBy ?? ref(toValue(options.defaultOrderBy) ?? 1)
  const orderDirection = options.orderDirection ?? ref<'asc' | 'desc'>('desc')
  const sort = computed(() => [{ key: orderBy.value, ascending: orderDirection.value === 'asc' }])
  const rows = computed<TableRow[]>(() => {
    const direction = orderDirection.value === 'asc' ? 1 : -1
    const sortKey = (value: Value) => typeof value === 'object' ? value.sortKey : value
    const compare = (a: Value, b: Value) => {
      const left = sortKey(a), right = sortKey(b)
      if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right) * direction
      if (left < right) return -direction
      if (left > right) return direction
      return 0
    }
    const fallback = toValue(options.defaultOrderBy) ?? 1
    return toValue(data).map((values, index) => ({ values, index, key: options.rowKey(index) }))
      .sort((a, b) => compare(a.values[orderBy.value], b.values[orderBy.value])
        || compare(a.values[fallback], b.values[fallback]) || compare(a.index, b.index))
  })

  function toggle(key: number) {
    if (orderBy.value === key) orderDirection.value = orderDirection.value === 'asc' ? 'desc' : 'asc'
    else {
      orderBy.value = key
      orderDirection.value = 'desc'
    }
  }

  return { rows, sort, toggle }
}

export function statisticsColumns(labels: string[]): ComposableTableColumn<TableRow, number>[] {
  return labels.map((label, key) => ({
    key, label, sortable: key !== 0,
    width: key === 0 ? `${(labels.length - 1) / 3}fr` : '1fr',
    minWidth: key === 0 ? 250 : 86,
    value: row => row.values[key],
  }))
}
