import type { VehicleSelection } from '../vehicleGrouping'
import { historySeriesColor, historySeriesColors } from '../timeSeries/seriesColors'

export type ComparisonSource = {
  tag: string
  name: string
  color: string
  selection: VehicleSelection
}

export function nextComparisonColor(sources: ComparisonSource[]) {
  return historySeriesColors.find(color => !sources.some(source => source.color === color)) ?? historySeriesColor(sources.length)
}
