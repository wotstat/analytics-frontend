import { markRaw, ref, shallowRef } from 'vue'
import type { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

export type ChartBundle = { chart: UniversalChart }

// Конструкторные опции рендереров движок менять не умеет: такие контролы пересоздают
// связку целиком. UniversalChart.vue цепляет инстанс только в onMounted, поэтому
// version идёт в :key — иначе новый график остался бы неприкреплённым, а старый живым.
// dispose делает сам UniversalChart.vue при размонтировании.
export function useChartInstance<T extends ChartBundle>(create: () => T) {
  const instance = shallowRef<T>(markRaw(create()))
  const version = ref(0)

  function rebuild() {
    instance.value = markRaw(create())
    version.value++
  }

  return { instance, version, rebuild }
}
