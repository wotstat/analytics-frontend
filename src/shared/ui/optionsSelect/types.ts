export type SelectOption<T extends string | number = string | number> = {
  value: T
  label: string
  selectedLabel?: string
  disabled?: boolean
}
