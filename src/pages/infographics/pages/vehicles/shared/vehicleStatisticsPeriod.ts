export type VehicleStatisticsPeriod = 1 | 7 | 30

export const vehicleStatisticsPeriods: { value: VehicleStatisticsPeriod, label: string }[] = [
  { value: 1, label: 'За последний день' },
  { value: 7, label: 'За последнюю неделю' },
  { value: 30, label: 'За последний месяц' },
]
