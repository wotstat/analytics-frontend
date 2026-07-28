export const cardClasses = [
  { value: '', label: '— нет —' },
  { value: 'debug-tt-accent', label: 'debug-tt-accent' },
  { value: 'debug-tt-danger', label: 'debug-tt-danger' },
] as const

export type CardClass = typeof cardClasses[number]['value']
