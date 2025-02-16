import { useLocalStorage } from "@vueuse/core";

export const displayVariants = [
  { value: 'total', label: 'Всего' },
  { value: 'delta', label: 'Прирост' },
] as const

export const preferredLogProcessor = useLocalStorage('bob25-preferred-log-processor', false);
export const displayVariant = useLocalStorage<typeof displayVariants[number]['value']>('bob25-selected-chart-display', 'total')


export const crossPeriodVariants = [
  { value: 'all', label: 'Всё время' },
  { value: 'day1', label: 'День 1' },
  { value: 'day2', label: 'День 2' },
  { value: 'day3', label: 'День 3' },
  { value: 'day4', label: 'День 4' },
  { value: 'day5', label: 'День 5' },
  { value: 'day6', label: 'День 6' },
  { value: 'day7', label: 'День 7' },
  { value: 'day8', label: 'День 8' },
  { value: 'day9', label: 'День 9' },
  { value: 'day10', label: 'День 10' },
] as const

export const crossTablePeriod = useLocalStorage<typeof crossPeriodVariants[number]['value']>('bob25-crosstable-period', 'all')