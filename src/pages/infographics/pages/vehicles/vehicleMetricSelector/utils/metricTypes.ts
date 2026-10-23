import type { IconType } from '@/shared/game/components/efficiencyIcon/utils'
import type { VehicleHistorySplit } from '../../timeSeries/split/historySplit'
import type { MetricData } from '../../shared/metricData/utils/types'

export type MetricPresentation = {
  icon: IconType
  label: string
  subtitle?: string
  color?: string
  headingLabel?: string
  headingColor?: string
  variantLabel?: string
  format?: 'integer' | 'decimal' | 'percent' | 'time' | 'distance'
}

export type MetricDateField = `${string}UpdatedDay`
export type MetricHistory = {
  splits: readonly VehicleHistorySplit[]
  battleSample: boolean
  outages: boolean
}

export type MetricDefinition = MetricPresentation & {
  data: MetricData
  history: MetricHistory
  updatedDayField?: MetricDateField
}

export type MetricOptionSection<Key extends string = string> = {
  title?: string
  help?: 'quantiles'
  columns?: 1 | 2 | 3
  options: readonly { value: Key, label: string, wide?: boolean }[]
}

export type MetricTileDefinition<Key extends string = string> = Pick<MetricPresentation, 'icon' | 'label' | 'subtitle' | 'color'> & {
  id: string
  defaultValue: Key
  values: readonly Key[]
  idleLabel?: string
  badgeTextColor?: string
  sections?: readonly MetricOptionSection<Key>[]
}

export type MetricGroupPresentation = {
  title: string
  color?: string
  note?: string
  helpText?: string
}

export type MetricCategory<Key extends string = string> = MetricGroupPresentation & { tiles: readonly MetricTileDefinition<Key>[] }
export type MetricCatalogEntry<Key extends string = string> = {
  metrics: Record<Key, MetricDefinition>
  tiles: readonly MetricTileDefinition<Key>[]
}
export type MetricCatalogSection = MetricGroupPresentation & { entries: readonly MetricCatalogEntry[] }
