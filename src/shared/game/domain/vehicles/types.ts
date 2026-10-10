export const vehicleTypes = ['HT', 'MT', 'LT', 'AT', 'SPG'] as const // Порядок классов используется в компактных кодах. Существующие позиции сохранять.
export type VehicleType = typeof vehicleTypes[number]
export const vehicleLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
export type VehicleLevel = typeof vehicleLevels[number]
