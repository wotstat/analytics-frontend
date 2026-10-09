export const LOCALE = 'RU'
export const localeRegionPriority = {
  'RU': ['RU', 'PT_RU', 'EU', 'NA'],
  'EN': ['EU', 'NA', 'RU'],
} as const

const localizationRegionPriority = [...localeRegionPriority[LOCALE], 'CN', 'ASIA'] as const
export const localizationRegionsSql = localizationRegionPriority.map(region => `'${region}'`).join(', ')
export const localizationRegionPrioritySql = `indexOf([${[...localizationRegionPriority].reverse().map(region => `'${region}'`).join(', ')}], region)`
