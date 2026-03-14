
const ONE_DAY = 24 * 60 * 60 * 1000
const RU_SEASON_LENGTH = 49 * ONE_DAY
const EU_SEASON_LENGTH = 40 * ONE_DAY
const SEASON_LENGTHS = {
  'ru:comp7_5_2': 14 * ONE_DAY, // более короткий тк запись модом началась не с начала натиска, а с середины сезона
  'eu:comp7_5_2': 40 * ONE_DAY,
}

export function getSeasonDuration(season: string, region: string) {
  const overrideLength = SEASON_LENGTHS[`${region.toLowerCase()}:${season}` as keyof typeof SEASON_LENGTHS]
  const seasonLength = overrideLength ?? (region == 'EU' ? EU_SEASON_LENGTH : RU_SEASON_LENGTH)
  return seasonLength
}