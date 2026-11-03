export const regions = ['RU', 'EU', 'NA', 'ASIA', 'CN'] as const

export const testRegions = ['PT_RU', 'RPT', 'CT'] as const

// Порядок используется в битовой маске регионов compare; новые регионы добавлять в конец.
export const queryRegions = [...regions, ...testRegions] as const
export type QueryRegion = typeof queryRegions[number]

// Индексы используются в компактных ID. Только дополнять в конце, включая архивные регионы.
export const gameRegions = ['RU', 'EU', 'NA', 'ASIA', 'CN', 'PT_RU', 'RPT', 'CT', 'KR'] as const
export type GameRegionCode = typeof gameRegions[number]

export function singleRegion(regions: readonly string[]): string | undefined {
  return regions.length === 1 ? regions[0] : undefined
}
