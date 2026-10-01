export type SelectOption<T extends string | number = string | number> = {
  value: T
  label: string
  disabled?: boolean
}
