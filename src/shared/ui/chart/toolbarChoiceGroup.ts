export type ToolbarChoiceOption<TValue extends string | number = string | number> = {
  value: TValue
  label: string
  tooltip?: string
  disabled?: boolean
}
