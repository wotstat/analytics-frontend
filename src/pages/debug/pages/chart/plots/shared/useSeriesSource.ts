import { computed, ref, watch } from 'vue'
import { syntheticSeries, type SeriesKind } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { ChartSeries, DataSource } from '@/pages/debug/shared/fixtures/types'
import { enableRealSeries, useSharedRealSeries } from './realData'

export function useSeriesSource(defaultKind: SeriesKind = 'smooth', defaultCount = 120) {
  const source = ref<DataSource>('synthetic')
  const kind = ref<SeriesKind>(defaultKind)
  const seed = ref(1)
  const count = ref(defaultCount)

  const real = useSharedRealSeries()
  watch(source, value => { if (value === 'real') enableRealSeries() })

  const series = computed<ChartSeries>(() => source.value === 'real'
    ? real.battles.value
    : syntheticSeries(kind.value, seed.value, count.value))

  const gaps = computed(() => series.value.reduce((sum, point) => point ? sum : sum + 1, 0))

  return { source, kind, seed, count, series, gaps, realStatus: real.status }
}

export type SeriesSource = ReturnType<typeof useSeriesSource>
