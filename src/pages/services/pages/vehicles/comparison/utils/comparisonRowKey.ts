import type { VehicleSelection } from '../../shared/vehicleGrouping'
import type { VehicleCategory } from '@/shared/game/encoding/vehicleCategories'
import { uniqueSorted } from '@/shared/utils/collections'

export function categoryRowKey({ level, type }: VehicleCategory): string {
  if (level === undefined) return `classes:${type}`
  if (type === undefined) return `levels:${level}`
  return `classesByLevel:${level}:${type}`
}

export function comparisonRowKey(rowKey: string, selection: VehicleSelection) {
  return JSON.stringify([
    rowKey,
    uniqueSorted(selection.levels),
    uniqueSorted(selection.types),
    uniqueSorted(selection.nations),
  ])
}
