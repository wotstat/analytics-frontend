import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

export type ChartBounds = { minX: number, maxX: number, minY: number, maxY: number }


export function useChartBounds(chart: MaybeRefOrGetter<UniversalChart | null | undefined>) {
  const bounds = ref<ChartBounds>({ minX: 0, maxX: 0, minY: 0, maxY: 0 })

  watch(() => toValue(chart), (current, _previous, onCleanup) => {
    if (!current) return

    onCleanup(current.onAfterRender.on(({ space }) => {
      const next = space.bounds
      const previous = bounds.value
      if (previous.minX === next.minX && previous.maxX === next.maxX &&
        previous.minY === next.minY && previous.maxY === next.maxY) return

      bounds.value = { minX: next.minX, maxX: next.maxX, minY: next.minY, maxY: next.maxY }
    }))
  }, { immediate: true })

  return bounds
}

export function formatBound(value: number) {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 10000) return value.toFixed(0)
  return value.toFixed(2)
}
