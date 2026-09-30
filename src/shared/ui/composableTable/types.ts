export type ComposableTableKey = string | number

export type ComposableTableColumn<Row, Key extends ComposableTableKey = ComposableTableKey> = {
  key: Key
  label?: string
  width?: number | string
  minWidth?: number
  align?: 'left' | 'center' | 'right'
  overflow?: 'ellipsis' | 'wrap' | 'visible'
  sortable?: boolean
  interactive?: boolean
  tooltip?: string
  value?: (row: Row) => unknown
}

export type ComposableTableSort<Key extends ComposableTableKey = ComposableTableKey> = {
  key: Key
  ascending: boolean
}

export type ComposableTableCellEvent<Row, Column> = {
  row: Row
  rowKey: ComposableTableKey
  column: Column
  columnKey: ComposableTableKey
  event: MouseEvent
}
