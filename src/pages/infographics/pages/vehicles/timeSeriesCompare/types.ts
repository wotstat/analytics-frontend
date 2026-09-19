import type { VehicleSelection } from '../vehicleGrouping'

export type ComparisonSource = {
  tag: string
  name: string
  color: string
  selection: VehicleSelection
}

const colors = ['#0a84ff', '#ff9f0a', '#30d158', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#ac8e68', '#5e5ce6', '#63e6be']

export function nextComparisonColor(sources: ComparisonSource[]) {
  return colors.find(color => !sources.some(source => source.color === color)) ?? colors[sources.length % colors.length]
}
