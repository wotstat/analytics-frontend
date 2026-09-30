import type { Classes } from '@/shared/uiKit/chart/universalChart/utils/utils'

export type ChartAnnotationOption = {
  id: string
  label: string
  classes?: Classes
  selected: boolean
  disabled?: boolean
}

export type ChartAnnotationGroup = {
  id: string
  label?: string
  layout?: 'row' | 'column'
  options: readonly ChartAnnotationOption[]
}
