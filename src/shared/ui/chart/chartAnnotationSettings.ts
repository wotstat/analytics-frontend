export type ChartAnnotationOption = {
  id: string
  label: string
  color?: string
  selected: boolean
  disabled?: boolean
}

export type ChartAnnotationGroup = {
  id: string
  label?: string
  layout?: 'row' | 'column'
  options: readonly ChartAnnotationOption[]
}
