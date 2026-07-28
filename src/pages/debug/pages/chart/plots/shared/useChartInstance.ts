import { markRaw, shallowRef } from 'vue'
import type { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

export type ChartBundle = { chart: UniversalChart }

// Конструкторные опции рендереров движок менять не умеет: такие контролы пересоздают связку
// целиком. Прицепить новый инстанс и снять старый UniversalChart.vue умеет сам — по смене prop.
export function useChartInstance<T extends ChartBundle>(create: () => T) {
  const instance = shallowRef<T>(markRaw(create()))

  function rebuild() {
    instance.value = markRaw(create())
  }

  return { instance, rebuild }
}
