import type { LegendItem } from './useLegend'

export type SeriesTooltipItem = Pick<LegendItem, 'tag' | 'name' | 'color'> & {
  value?: number | null
  highlighted?: boolean
}
