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

export type MetricOptionSection<Key extends string> = {
  title?: string
  help?: 'quantiles'
  columns?: 1 | 2 | 3
  options: readonly { value: Key, label: string, wide?: boolean }[]
}

export function aggregationSections<Key extends string>(
  average: Key, variants: readonly Aggregation[], valueFor: (aggregation: Aggregation) => Key,
): MetricOptionSection<Key>[] {
  const option = (aggregation: Aggregation) => ({
    value: valueFor(aggregation),
    label: aggregation.startsWith('q') ? `${Number(aggregation.slice(1))}%` : aggregations[aggregation].label,
  })

  const summary = ['min', 'max'] as const
  const sections: MetricOptionSection<Key>[] = [
    {
      columns: 2,
      options: [{ value: average, label: 'Среднее', wide: true }, ...summary.filter(key => variants.includes(key)).map(option)],
    },
    {
      title: 'Квантили', help: 'quantiles', columns: 3,
      options: variants.filter(key => key.startsWith('q')).map(option),
    },
  ]
  if (variants.includes('zero')) sections.push({ options: [option('zero')] })
  return sections.filter(section => section.options.length)
}
