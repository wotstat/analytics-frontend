export const regions = ['RU', 'EU', 'NA', 'ASIA', 'CN'] as const
export type OnslaughtRegion = typeof regions[number] | 'CT'
