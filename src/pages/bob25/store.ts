import { useLocalStorage } from "@vueuse/core";

export const displayVariants = [
  { value: 'total', label: 'Всего' },
  { value: 'delta', label: 'Прирост' },
] as const

export const preferredLogProcessor = useLocalStorage('bob25-preferred-log-processor', false);
export const displayVariant = useLocalStorage<typeof displayVariants[number]['value']>('bob25-selected-chart-display', 'total')