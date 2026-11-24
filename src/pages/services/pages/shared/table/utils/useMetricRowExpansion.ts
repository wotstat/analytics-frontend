import { ref, type Ref } from 'vue'
import type { ComposableTableKey } from '@/shared/ui/composableTable/types'

export function useMetricRowExpansion<Metric>(
  activeMetric: Ref<Metric>,
  isSameMetric: (left: Metric, right: Metric) => boolean = Object.is,
) {
  const expandedRows = ref<ComposableTableKey[]>([])

  function expansionCellClass(rowKey: ComposableTableKey, metric?: Metric) {
    if (metric === undefined) return 'row-toggle'
    if (expandedRows.value.includes(rowKey) && isSameMetric(activeMetric.value, metric)) return 'active-value'
  }

  function toggleRow(rowKey: ComposableTableKey, metric?: Metric) {
    const expanded = expandedRows.value.includes(rowKey)
    if (expanded && (metric === undefined || isSameMetric(activeMetric.value, metric))) {
      expandedRows.value = expandedRows.value.filter(key => key !== rowKey)
      return
    }
    if (metric !== undefined) activeMetric.value = metric
    if (!expanded) expandedRows.value = [...expandedRows.value, rowKey]
  }

  return { expandedRows, expansionCellClass, toggleRow }
}
