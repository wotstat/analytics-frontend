import type { VehicleGrouping } from '../../vehicleGrouping'
import { quote } from '../../utils/sql'

export function vehicleGroupingSql(grouping: VehicleGrouping) {
  const keys = grouping === 'tanks' ? ['tankTag'] : [
    ...(grouping === 'levels' || grouping === 'classesByLevel' ? ['tankLevel'] : []),
    ...(grouping === 'classes' || grouping === 'classesByLevel' ? ['tankType'] : []),
  ]
  const dimensions = keys.map(key => `stats.${key}`)
  const rowKey = grouping === 'tanks' ? 'stats.tankTag'
    : `concat(${quote(`${grouping}:`)}, ${dimensions.map(column => `toString(${column})`).join(", ':', ")})`
  return { keys, groupBy: dimensions.join(', '), rowKey }
}
