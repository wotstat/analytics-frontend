// Синтетика и реальные запросы отдают одну и ту же форму, поэтому переключатель
// источника не требует переписывать страницу.

export type ChartPoint = { x: number, y: number }

// `null` внутри массива — разрыв: AutoLine рвёт на этом месте сегмент.
export type ChartSeries = (ChartPoint | null)[]

export type TableRow = {
  id: number
  name: string
  battles: number
  damage: number
  winrate: number
}

export type DataSource = 'synthetic' | 'real'

export const dataSources = [
  { value: 'synthetic', label: 'Синтетика' },
  { value: 'real', label: 'Реальные данные' },
] as const satisfies readonly { value: DataSource, label: string }[]
