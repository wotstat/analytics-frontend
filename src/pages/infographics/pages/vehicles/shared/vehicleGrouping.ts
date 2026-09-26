import type { VehicleStatistics } from './types'

export const vehicleGroupings = [
  { value: 'tanks', label: 'Танки' },
  { value: 'levels', label: 'Уровни' },
  { value: 'classes', label: 'Классы' },
  { value: 'classesByLevel', label: 'Классы по уровням' },
] as const

export type VehicleGrouping = typeof vehicleGroupings[number]['value']

export type VehicleSelection = {
  levels: number[]
  types: string[]
  nations: string[]
  tankTag?: string
}

export function vehicleHistorySelection(vehicle: VehicleStatistics, selection: VehicleSelection): VehicleSelection {
  const { tankTag, tankLevel, tankType } = vehicle
  if (tankTag !== null) return { tankTag, levels: [], types: [], nations: [] }

  return {
    levels: tankLevel === null ? [...selection.levels] : [tankLevel],
    types: tankType === null ? [...selection.types] : [tankType],
    nations: [...selection.nations],
  }
}
