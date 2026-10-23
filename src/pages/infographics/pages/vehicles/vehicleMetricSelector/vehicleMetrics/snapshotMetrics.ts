import { snapshotMetricData } from '../../shared/metricData/snapshotMetricData'
import type { MetricDateField, MetricDefinition, MetricCatalogEntry, MetricHistory, MetricPresentation, MetricTileDefinition } from '../utils/metricTypes'

const history: MetricHistory = { splits: [], battleSample: false, outages: false }

type SnapshotDefinition<Percentile extends number> = Pick<MetricPresentation, 'icon' | 'label' | 'color' | 'headingColor'> & Pick<MetricTileDefinition, 'badgeTextColor'> & {
  tables: { history: string, latest: string }
  percentiles: readonly Percentile[]
  icons?: Partial<Record<Percentile, MetricPresentation['icon']>>
  presets: readonly { percentile: Percentile, label: string }[]
  defaultPercentile: Percentile
}

export function snapshotMetrics<const Key extends string, const Percentile extends number>(key: Key,
  definition: SnapshotDefinition<Percentile>): MetricCatalogEntry<`${Key}_p${Percentile}`> {
  type Value = `${Key}_p${Percentile}`
  const valueKey = (percentile: Percentile): Value => `${key}_p${percentile}`
  const updatedDayField: MetricDateField = `${key}UpdatedDay`
  const { icon, color, headingColor, badgeTextColor } = definition
  const values = definition.percentiles.map(valueKey)
  const data = snapshotMetricData(key, definition.tables,
    definition.percentiles.map(percentile => ({ key: valueKey(percentile), column: `p${percentile}` })), updatedDayField)

  const metrics = Object.fromEntries(definition.percentiles.map(percentile => {
    const value = valueKey(percentile)
    const preset = definition.presets.find(preset => preset.percentile === percentile)
    const label = preset?.label ?? `${percentile}%`
    return [value, {
      icon: definition.icons?.[percentile] ?? icon, color, headingColor, label: `${definition.label} · ${label}`,
      headingLabel: `${percentile}%`, variantLabel: `${percentile}%`,
      data: data[value],
      updatedDayField, history,
    } satisfies MetricDefinition]
  })) as Record<Value, MetricDefinition>

  const presets = definition.presets.map(preset => valueKey(preset.percentile))
  const defaultValue = valueKey(definition.defaultPercentile)

  return {
    metrics,
    tiles: [
      ...definition.presets.map(preset => {
        const value = valueKey(preset.percentile)
        return {
          id: value, icon: metrics[value].icon, color, badgeTextColor, label: preset.label,
          defaultValue: value, values: [value], idleLabel: `${preset.percentile}%`,
        }
      }),
      {
        id: `${key}_other`, icon, color, badgeTextColor, label: 'Другое значение',
        defaultValue, values: values.filter(value => !presets.includes(value)),
        idleLabel: `${definition.defaultPercentile}%`,
        sections: [{ columns: 3, options: definition.percentiles.map(percentile => ({ value: valueKey(percentile), label: `${percentile}%` })) }],
      },
    ],
  }
}
