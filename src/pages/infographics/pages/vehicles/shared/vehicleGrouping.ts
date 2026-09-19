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
