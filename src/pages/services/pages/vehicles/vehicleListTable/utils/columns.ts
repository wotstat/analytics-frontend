export const EXPAND_MIN_TABLE_WIDTH = 720
export const COMPARE_MIN_TABLE_WIDTH = 440

export const vehicleColumns = {
  compare: { key: 'compare', width: 36 },
  expand: { key: 'expand', width: 20, interactive: true },
  tankLevel: { key: 'tankLevel', label: 'Уровень', width: 40, sortable: true, interactive: true },
  tankType: { key: 'tankType', label: 'Тип техники', width: 40, sortable: true, interactive: true },
} as const

export const vehicleNameColumn = (tableWidth: number) => ({
  key: 'name',
  label: 'Название танка',
  width: Math.max(140, tableWidth * 0.25),
  align: 'left',
  sortable: true,
  interactive: true,
} as const)
