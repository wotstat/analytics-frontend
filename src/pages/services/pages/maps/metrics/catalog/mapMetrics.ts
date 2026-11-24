import { aggregations, aggregationOrder, type Aggregation } from '../../../shared/columnSelector/utils/aggregations'
import type { MetricTileDefinition } from '../../../vehicles/metrics/utils/metricTypes'
import { battleMetricCategories, type BattleMetric, type Slot } from '../../../vehicles/metrics/catalog/vehicleMetrics'

type MapMetricPresentation = Pick<MetricTileDefinition, 'label' | 'icon' | 'subtitle' | 'color' | 'badgeTextColor'> & {
  aggregations?: readonly Aggregation[]
  delta?: boolean
}

const mapOnlyMetrics = [
  { id: 'spawnBalance', label: 'Баланс респов', icon: 'win' },
  { id: 'drawRate', label: 'Ничьи', icon: 'tank-equal' },
  { id: 'captureRate', label: 'Победы захватом базы', icon: 'base-capture', delta: true },
] as const satisfies readonly (MapMetricPresentation & { id: string })[]

export type MapMetric = BattleMetric | typeof mapOnlyMetrics[number]['id']
export type MapAggregation = 'value' | Aggregation
export type MapMetricSlot = { metric: MapMetric, aggregation: MapAggregation }
type MapMetricDefinition = MapMetricPresentation & { id: MapMetric }

const mapOverviewMetrics: readonly MapMetric[] = ['battles', 'playerCount', 'spawnBalance', 'duration', 'drawRate', 'captureRate']

function toMapMetric({ defaultValue, label, icon, subtitle, color, badgeTextColor, values }: MetricTileDefinition<Slot>): MapMetricDefinition {
  const id = defaultValue as BattleMetric
  const variants = aggregationOrder.filter(aggregation => values.includes(`${id}_${aggregation}` as Slot))
  return {
    id, label, icon, subtitle, color, badgeTextColor,
    aggregations: variants.length ? variants : undefined,
    delta: !mapOverviewMetrics.includes(id),
  }
}

const battleCategories = battleMetricCategories.map(({ title, color, tiles }) => ({
  title, color, metrics: tiles.map(toMapMetric),
}))
const metrics = [...battleCategories.flatMap(category => category.metrics), ...mapOnlyMetrics]
export const mapMetrics = Object.fromEntries(metrics.map(metric => [metric.id, metric])) as Record<MapMetric, MapMetricDefinition>

export const mapMetricCategories: { title: string, color?: string, metrics: MapMetricDefinition[] }[] = [
  { title: 'Карта и бои', metrics: mapOverviewMetrics.map(metric => mapMetrics[metric]) },
  ...battleCategories.map(category => ({
    ...category,
    metrics: category.metrics.filter(metric => !mapOverviewMetrics.includes(metric.id)),
  })).filter(category => category.metrics.length),
]

export const mapMetricOrder = mapMetricCategories.flatMap(category => category.metrics.map(metric => metric.id))
export const mapDeltaLabel = 'Разница по командам'

export function mapMetricLabel({ metric, aggregation }: MapMetricSlot, delta = false) {
  const definition = mapMetrics[metric]
  return [
    definition.label,
    definition.aggregations && (aggregation === 'value' ? 'Среднее' : aggregations[aggregation].label),
    delta && mapDeltaLabel,
  ].filter(Boolean).join(' · ')
}

export function mapMetricShortLabel({ metric, aggregation }: MapMetricSlot) {
  if (aggregation === 'value' || !mapMetrics[metric].aggregations) return ''
  return aggregations[aggregation].shortLabel
}
