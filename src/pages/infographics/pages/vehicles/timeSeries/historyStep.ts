import type { TimeSeriesStep } from '@/shared/ui/chart/timeSeries'

export type HistoryStep = TimeSeriesStep
export type HistoryAverageWindow = 3 | 5 | 7 | null

export {
  utcDayStart as historyDayStart,
  utcDayString as historyDayString,
  nextTimeSeriesPeriod as nextHistoryPeriod,
  timeSeriesPeriodWindow as historyPeriodWindow,
} from '@/shared/ui/chart/timeSeriesTime'
