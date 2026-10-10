import { vehicleLevels, vehicleTypes, type VehicleType } from '../domain/vehicles/types'

export type VehicleCategory = { level?: number, type?: VehicleType }

// Постоянные диапазоны: 1..15 уровни, 16..23 калссы, 32..151 пары.
// Шаг пары не зависит от длины списков, поэтому добавление класса не меняет старые ID.
if (vehicleLevels.length > 15 || vehicleTypes.length > 8) throw new Error('Compact vehicle category ID range exhausted')

export const vehicleCategoryCompactor = {
  compact: (category: VehicleCategory): number => {
    const { level, type } = category
    if (level !== undefined && !vehicleLevels.includes(level as typeof vehicleLevels[number])) throw new Error('Invalid vehicle tier')

    const index = type === undefined ? -1 : vehicleTypes.indexOf(type)
    if (type !== undefined && index < 0) throw new Error('Invalid vehicle class')

    if (level !== undefined && type !== undefined) return 32 + (level - 1) * 8 + index
    if (level !== undefined) return level
    if (type !== undefined) return 16 + index
    throw new Error('Empty vehicle category')
  },

  expand: (code: number): VehicleCategory => {
    if (!Number.isInteger(code)) throw new Error('Invalid vehicle category')

    if (code > 0 && code < 16 && vehicleLevels.includes(code as typeof vehicleLevels[number])) return { level: code }
    if (code >= 16 && code < 24 && vehicleTypes[code - 16] !== undefined) return { type: vehicleTypes[code - 16] }

    const level = Math.floor((code - 32) / 8) + 1
    const type = vehicleTypes[(code - 32) % 8]

    if (code >= 32 && code < 152 && vehicleLevels.includes(level as typeof vehicleLevels[number]) && type !== undefined) return { level, type }
    throw new Error('Invalid vehicle category')
  },
}
