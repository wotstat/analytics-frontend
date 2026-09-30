import type { ComposableTableColumn } from '@/shared/ui/composableTable/types'

export type DemoRow = { id: string, name: string, score: number | null | undefined, count: number }
export type DemoColumn = ComposableTableColumn<DemoRow, 'name' | 'score' | 'count'>

export const demoRows: DemoRow[] = [
  { id: 'alpha', name: 'Альфа', score: 125, count: 30 },
  { id: 'beta', name: 'Бета', score: null, count: 20 },
  { id: 'gamma', name: 'Гамма', score: 0, count: 20 },
  { id: 'delta', name: 'Дельта', score: 125, count: 10 },
  { id: 'epsilon', name: 'Эпсилон', score: undefined, count: 0 },
  { id: 'zeta', name: 'Очень длинное название для проверки переноса и обрезки содержимого', score: -5, count: 40 },
]

export const demoColumns: DemoColumn[] = [
  { key: 'name', label: 'Название', minWidth: 180, width: '2fr', align: 'left', value: row => row.name },
  { key: 'score', label: 'Значение', minWidth: 100, align: 'right', value: row => row.score },
  { key: 'count', label: 'Количество', width: 120, value: row => row.count },
]
