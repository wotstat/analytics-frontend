export const vehicleTypes = ['HT', 'MT', 'LT', 'AT', 'SPG'] as const
export type VehicleType = typeof vehicleTypes[number]
export const vehicleLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
export type VehicleLevel = typeof vehicleLevels[number]
