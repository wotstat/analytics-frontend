import type { Slot } from '../../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'

export type AchievementKind = 'marks' | 'mastery'

type AchievementDefinition = {
  latestTable: string
  slots: readonly Slot[]
}

export const achievements: Record<AchievementKind, AchievementDefinition> = {
  marks: {
    latestTable: 'MoeInfoLatest',
    slots: ['marks_p100', 'marks_p95', 'marks_p85', 'marks_p65'],
  },
  mastery: {
    latestTable: 'MasteryInfoLatest',
    slots: ['mastery_p99', 'mastery_p95', 'mastery_p80', 'mastery_p50'],
  },
}
