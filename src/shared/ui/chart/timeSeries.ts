export type TimeSeriesStep = 'day' | 'week' | 'month'

export type TimeSeriesPoint = { x: number, y: number }

export type TimeSeries<T extends TimeSeriesPoint = TimeSeriesPoint> = {
  tag: string
  points: readonly (T | null)[]
  enabled?: boolean
}

export type TimeSeriesRange = { minX: number, maxX: number }

export type TimeSeriesZoomLimits = {
  minX?: number
  maxX?: number
  minDeltaX?: number
  maxDeltaX?: number
  elastic?: boolean
}

export type TimeSeriesValueFormat = {
  formatValue: (value: number, tickStep: number) => string
  fractional?: boolean
  minValue?: number
}
