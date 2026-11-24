export const tableStatisticsPeriods = [
  { value: 1, label: 'За последний день' },
  { value: 7, label: 'За последнюю неделю' },
  { value: 30, label: 'За последний месяц' },
] as const

export type TableStatisticsPeriod = typeof tableStatisticsPeriods[number]['value']

export const defaultTableStatisticsPeriod: TableStatisticsPeriod = 30
