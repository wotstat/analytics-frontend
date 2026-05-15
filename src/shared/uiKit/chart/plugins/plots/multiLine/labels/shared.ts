export type Font = {
  font?: string
} | {
  fontSize?: number
  fontFamily?: string
}


export type EdgeLabels = {
  showEdgeLabels?: boolean
}

export type ZeroLabel = {
  showZeroLabel?: boolean
  zeroLabel?: string
}

export type Padding = {
  padding?: number
}

export type LabelForValue = {
  labelForValue?(value: number): string
}

export type KeyForValue = {
  keyForValue?(value: number, label: string): string
}