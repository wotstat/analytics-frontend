export const aggregations = {
  min: { label: 'Минимум', shortLabel: 'Мин.' },
  max: { label: 'Максимум', shortLabel: 'Макс.' },
  q01: { label: 'Квантиль 1%', shortLabel: 'Q1' },
  q05: { label: 'Квантиль 5%', shortLabel: 'Q5' },
  q10: { label: 'Квантиль 10%', shortLabel: 'Q10' },
  q25: { label: 'Квантиль 25%', shortLabel: 'Q25' },
  q50: { label: 'Медиана (50%)', shortLabel: 'Мед.' },
  q75: { label: 'Квантиль 75%', shortLabel: 'Q75' },
  q90: { label: 'Квантиль 90%', shortLabel: 'Q90' },
  q95: { label: 'Квантиль 95%', shortLabel: 'Q95' },
  q99: { label: 'Квантиль 99%', shortLabel: 'Q99' },
  zero: { label: 'Доля нулевых значений', shortLabel: '0%' },
} as const

export type Aggregation = keyof typeof aggregations
export const aggregationOrder = Object.keys(aggregations) as Aggregation[]
export const quantileLevels = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]

