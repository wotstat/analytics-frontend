import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

export type SpaceSnapshot = {
  layout: { x: number, y: number, width: number, height: number }
  bounds: { minX: number, maxX: number, minY: number, maxY: number }
}

export function useSpaceProbe(chart: MaybeRefOrGetter<UniversalChart>) {
  const snapshot = ref<SpaceSnapshot>({
    layout: { x: 0, y: 0, width: 0, height: 0 },
    bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  })

  watch(() => toValue(chart), (current, _previous, onCleanup) => {
    onCleanup(current.onAfterRender.on(({ space }) => {
      const { x, y, width, height } = space.layout
      const { minX, maxX, minY, maxY } = space.bounds

      // Событие приходит на каждый кадр, а Vue дёргать стоит только на реальном изменении.
      const previous = snapshot.value
      if (previous.layout.x === x && previous.layout.y === y &&
        previous.layout.width === width && previous.layout.height === height &&
        previous.bounds.minX === minX && previous.bounds.maxX === maxX &&
        previous.bounds.minY === minY && previous.bounds.maxY === maxY) return

      snapshot.value = { layout: { x, y, width, height }, bounds: { minX, maxX, minY, maxY } }
    }))
  }, { immediate: true })

  return snapshot
}

export function formatNumber(value: number, digits = 1) {
  if (Number.isNaN(value)) return 'NaN'
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞'
  return value.toFixed(digits)
}
