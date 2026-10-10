
// Индексы используются в компактных ID. Только дополнять в конце, включая архивные регионы.
export const gameRegions = ['RU', 'EU', 'NA', 'ASIA', 'CN', 'PT_RU', 'RPT', 'CT', 'KR'] as const
export type GameRegionCode = typeof gameRegions[number]

export function singleRegion(regions: readonly string[]): string | undefined {
  return regions.length === 1 ? regions[0] : undefined
}
