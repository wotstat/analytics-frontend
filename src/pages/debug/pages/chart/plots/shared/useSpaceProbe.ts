import { useElementVisibility, useRafFn } from '@vueuse/core'
import { ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

export type SpaceSnapshot = {
  layout: { x: number, y: number, width: number, height: number }
  bounds: { minX: number, maxX: number, minY: number, maxY: number }
}

export function useSpaceProbe(
  chart: MaybeRefOrGetter<UniversalChart>,
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
) {
  const snapshot = ref<SpaceSnapshot>({
    layout: { x: 0, y: 0, width: 0, height: 0 },
    bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  })

  const visible = useElementVisibility(target)

  const { pause, resume } = useRafFn(() => {
    const space = toValue(chart).space
    const { x, y, width, height } = space.layout
    const { minX, maxX, minY, maxY } = space.bounds

    const current = snapshot.value
    if (current.layout.x === x && current.layout.y === y &&
      current.layout.width === width && current.layout.height === height &&
      current.bounds.minX === minX && current.bounds.maxX === maxX &&
      current.bounds.minY === minY && current.bounds.maxY === maxY) return

    snapshot.value = { layout: { x, y, width, height }, bounds: { minX, maxX, minY, maxY } }
  }, { immediate: false })

  watch(visible, value => value ? resume() : pause(), { immediate: true })

  return snapshot
}

export function formatNumber(value: number, digits = 1) {
  if (Number.isNaN(value)) return 'NaN'
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞'
  return value.toFixed(digits)
}
