import { snapshotMetricData } from '../../shared/metricData/snapshotMetricData/snapshotMetricData'
import type { MetricDateField, MetricDefinition, MetricCatalogEntry, MetricHistory, MetricPresentation, MetricTileDefinition } from '../utils/metricTypes'

const history: MetricHistory = {
  splits: [],
  battleSample: false,
  outages: false,
  isValidValue: value => value !== 0,
}

type SnapshotDefinition<Percentile extends number> = Pick<MetricPresentation, 'icon' | 'label' | 'color' | 'headingColor'> & Pick<MetricTileDefinition, 'badgeTextColor'> & {
  tables: { history: string, latest: string }
  percentiles: readonly Percentile[]
  icons?: Partial<Record<Percentile, MetricPresentation['icon']>>
  presets: readonly { percentile: Percentile, label: string }[]
  defaultPercentile: Percentile
}

export function snapshotMetrics<const Key extends string, const Percentile extends number>(
  key: Key,
  definition: SnapshotDefinition<Percentile>,
): MetricCatalogEntry<`${Key}_p${Percentile}`> {
  type Value = `${Key}_p${Percentile}`
  const valueKey = (percentile: Percentile): Value => `${key}_p${percentile}`
  const { icon, label, color, headingColor, badgeTextColor } = definition
  const { tables, percentiles, icons, presets, defaultPercentile } = definition

  const updatedDayField: MetricDateField = `${key}UpdatedDay`
  const columns = percentiles.map(percentile => ({ key: valueKey(percentile), column: `p${percentile}` }))
  const data = snapshotMetricData(key, tables, columns, updatedDayField)

  const metrics = Object.fromEntries(percentiles.map(percentile => {
    const value = valueKey(percentile)
    const percentileLabel = `${percentile}%`
    const preset = presets.find(preset => preset.percentile === percentile)
    return [value, {
      icon: icons?.[percentile] ?? icon,
      color,
      headingColor,
      label: `${label} · ${preset?.label ?? percentileLabel}`,
      headingLabel: percentileLabel,
      variantLabel: percentileLabel,
      data: data[value],
      updatedDayField,
      history,
    } satisfies MetricDefinition]
  })) as Record<Value, MetricDefinition>

  const presetTiles = presets.map(({ percentile, label: presetLabel }) => {
    const value = valueKey(percentile)
    return {
      id: value,
      icon: metrics[value].icon,
      color,
      badgeTextColor,
      label: presetLabel,
      defaultValue: value,
      values: [value],
      idleLabel: `${percentile}%`,
    }
  })

  const presetValues = presetTiles.map(tile => tile.defaultValue)
  const options = percentiles.map(percentile => ({ value: valueKey(percentile), label: `${percentile}%` }))
  const otherTile = {
    id: `${key}_other`,
    icon,
    color,
    badgeTextColor,
    label: 'Другое значение',
    defaultValue: valueKey(defaultPercentile),
    values: options.map(option => option.value).filter(value => !presetValues.includes(value)),
    idleLabel: `${defaultPercentile}%`,
    sections: [{ columns: 3, options }],
  } satisfies MetricTileDefinition<Value>

  return { metrics, tiles: [...presetTiles, otherTile] }
}
