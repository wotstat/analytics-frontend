import type { Slot } from '../../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import type { VehicleStatisticsRow } from '../../vehicles/shared/types'

export type AchievementKind = 'marks' | 'mastery'
export const achievementDeltaPeriods = ['day', 'week', 'month', 'quarter', 'half-year', 'year'] as const
export type AchievementDeltaPeriod = typeof achievementDeltaPeriods[number]
export type AchievementDeltaSelection = 'none' | AchievementDeltaPeriod
export type AchievementStatisticsRow = VehicleStatisticsRow
  & Partial<Record<`${Slot}_delta_${AchievementDeltaPeriod}`, number | null>>

export function achievementDelta(row: AchievementStatisticsRow, slot: Slot, period: AchievementDeltaSelection) {
  return period === 'none' ? null : row[`${slot}_delta_${period}`] ?? null
}

type AchievementDefinition = {
  latestTable: string
  historyTable: string
  slots: readonly Slot[]
  defaultSortSlot: Slot
}

export const achievements: Record<AchievementKind, AchievementDefinition> = {
  marks: {
    latestTable: 'MoeInfoLatest',
    historyTable: 'MoeInfo',
    slots: ['marks_p100', 'marks_p95', 'marks_p85', 'marks_p65'],
    defaultSortSlot: 'marks_p95',
  },
  mastery: {
    latestTable: 'MasteryInfoLatest',
    historyTable: 'MasteryInfo',
    slots: ['mastery_p99', 'mastery_p95', 'mastery_p80', 'mastery_p50'],
    defaultSortSlot: 'mastery_p99',
  },
}
