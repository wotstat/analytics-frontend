import { useRafFn } from '@vueuse/core'
import { ref, toValue, type MaybeRefOrGetter } from 'vue'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

export type ChartBounds = { minX: number, maxX: number, minY: number, maxY: number }


export function useChartBounds(chart: MaybeRefOrGetter<UniversalChart | null | undefined>, active?: MaybeRefOrGetter<boolean>) {
  const bounds = ref<ChartBounds>({ minX: 0, maxX: 0, minY: 0, maxY: 0 })

  useRafFn(() => {
    if (active !== undefined && !toValue(active)) return

    const current = toValue(chart)
    if (!current) return

    const next = current.space.bounds
    const previous = bounds.value
    if (previous.minX === next.minX && previous.maxX === next.maxX &&
      previous.minY === next.minY && previous.maxY === next.maxY) return

    bounds.value = { minX: next.minX, maxX: next.maxX, minY: next.minY, maxY: next.maxY }
  })

  return bounds
}

export function formatBound(value: number) {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 10000) return value.toFixed(0)
  return value.toFixed(2)
}
