import { battleMetricData } from '../../shared/metricData/battle/battleMetricData'
import type { StatisticExpression, StatisticExpressions } from '../../shared/metricData/battle/expressions'
import { aggregations, quantileLevels, type Aggregation } from './aggregations'
import type { MetricCatalogEntry, MetricHistory, MetricOptionSection, MetricPresentation, MetricDefinition } from '../utils/metricTypes'

const history: MetricHistory = {
  splits: ['arena', 'platoon', 'result', 'battleLevel'], battleSample: true, outages: true,
}

type StatisticDefinition<Variants extends readonly Aggregation[]> = MetricPresentation & StatisticExpression & {
  defaultLabel?: string
  aggregations?: Variants
  column?: string
  valueCount?: boolean
}

function aggregationExpression(column: string, valueCount: boolean, aggregation: Aggregation, daily = false) {
  const value = `stats.${column}`
  const countColumn = valueCount ? `${column}ValueCount` : 'battles'
  const count = daily ? `sum(stats.${countColumn})` : `count(${value})`

  switch (aggregation) {
    case 'min': return `minOrNull(${value}${daily ? 'Min' : ''})`
    case 'max': return `maxOrNull(${value}${daily ? 'Max' : ''})`
    case 'zero': {
      const zeroCount = daily ? `sum(${value}ZeroCount)` : `countIf(${value} = 0)`
      return `${zeroCount} / nullIf(${count}, 0) * 100`
    }
    default: {
      const index = quantileLevels.indexOf(Number(aggregation.slice(1)) / 100) + 1
      const quantileFunction = daily ? 'quantilesTDigestMerge' : 'quantilesTDigest'
      const quantileValue = daily ? `${value}QuantilesState` : value
      return `if(${count} = 0, NULL, ${quantileFunction}(${quantileLevels.join(', ')})(${quantileValue})[${index}])`
    }
  }
}

export function statisticMetric<const Key extends string, const Variants extends readonly Aggregation[] = readonly []>(
  key: Key, definition: StatisticDefinition<Variants>): MetricCatalogEntry<Key | `${Key}_${Variants[number]}`> {
  type Value = Key | `${Key}_${Variants[number]}`
  const { defaultLabel, aggregations: variants = [], sql, dailySql, column = key, valueCount = false, ...presentation } = definition
  const values: Value[] = [key]
  const expressions: StatisticExpressions = { [key]: { sql, dailySql } }
  const labels: Record<string, MetricPresentation> = {
    [key]: { ...presentation, label: defaultLabel ?? presentation.label, variantLabel: variants.length ? 'Сред.' : undefined },
  }

  for (const aggregation of variants) {
    const value = `${key}_${aggregation}` as Value
    values.push(value)
    expressions[value] = {
      sql: aggregationExpression(column, valueCount, aggregation),
      dailySql: aggregationExpression(column, valueCount, aggregation, true),
    }
    labels[value] = {
      ...presentation, label: `${presentation.label} · ${aggregations[aggregation].label}`,
      headingLabel: aggregations[aggregation].shortLabel, variantLabel: aggregations[aggregation].shortLabel,
      format: aggregation === 'zero' ? 'percent' : presentation.format,
    }
  }

  const data = battleMetricData(key, expressions)
  const metrics = Object.fromEntries(values.map(value => [value, { ...labels[value], data, history }])) as Record<Value, MetricDefinition>

  const option = (variant: Aggregation) => ({
    value: `${key}_${variant}` as Value,
    label: variant.startsWith('q') ? `${Number(variant.slice(1))}%` : aggregations[variant].label,
  })

  const sections: MetricOptionSection<Value>[] = [
    { columns: 2, options: [{ value: key, label: 'Среднее', wide: true }, option('min'), option('max')] },
    {
      title: 'Квантили', help: 'quantiles', columns: 3,
      options: variants.filter(variant => variant.startsWith('q')).map(option)
    },
    { options: [option('zero')] },
  ]
  const availableSections = sections
    .map(section => ({ ...section, options: section.options.filter(option => values.includes(option.value)) }))
    .filter(section => section.options.length)

  return {
    metrics,
    tiles: [{
      ...presentation, id: key, defaultValue: key, values,
      sections: values.length > 1 ? availableSections : undefined,
    }],
  }
}
