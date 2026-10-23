import type { Slot } from '../vehicleMetrics/vehicleMetrics'
import type { MetricTileDefinition } from './metricTypes'

export type MetricTile = MetricTileDefinition<Slot>

export function selectedTileValues(tile: MetricTile, selected: readonly Slot[]) {
  return selected.filter(value => tile.values.includes(value))
}

export function canSelectMetric(value: Slot, selected: readonly Slot[], maxSlots?: number) {
  return selected.includes(value) || maxSlots === undefined || selected.length < maxSlots
}

export function toggleMetricTile(tile: MetricTile, selected: readonly Slot[], maxSlots?: number): Slot[] {
  if (selectedTileValues(tile, selected).length) return selected.filter(value => !tile.values.includes(value))
  if (!canSelectMetric(tile.defaultValue, selected, maxSlots)) return [...selected]
  return [...selected, tile.defaultValue]
}
