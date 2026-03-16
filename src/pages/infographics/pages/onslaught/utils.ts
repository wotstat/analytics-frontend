
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

export const ranksLestaMap = {
  1: 'first_E',
  80: 'first_D',
  160: 'first_C',
  240: 'first_B',
  320: 'first_A',
  400: 'second_E',
  500: 'second_D',
  600: 'second_C',
  700: 'second_B',
  800: 'second_A',
  900: 'third_E',
  1050: 'third_D',
  1200: 'third_C',
  1350: 'third_B',
  1500: 'third_A',
  1650: 'fourth_E',
  1850: 'fourth_D',
  2050: 'fourth_C',
  2250: 'fourth_B',
  2450: 'fourth_A',
  2650: 'fifth_logo'
}

export const rankWgMap = {
  1: 'first_E',
  100: 'first_D',
  200: 'first_C',
  300: 'first_B',
  400: 'first_A',
  500: 'second_E',
  600: 'second_D',
  700: 'second_C',
  800: 'second_B',
  900: 'second_A',
  1000: 'third_E',
  1100: 'third_D',
  1200: 'third_C',
  1300: 'third_B',
  1400: 'third_A',
  1500: 'fourth_E',
  1600: 'fourth_D',
  1700: 'fourth_C',
  1800: 'fourth_B',
  1900: 'fourth_A',
  2000: 'fifth_logo'
}

export function getDivisionByRating(rating: number, region: string) {
  if (rating == 0) return 'qual'
  const targetMap = region == 'EU' ? rankWgMap : ranksLestaMap
  const key = Object.keys(targetMap).reverse().find(key => rating >= parseInt(key))
  return key ? targetMap[parseInt(key) as keyof typeof targetMap] : 'first_E'
}

export function getRankByRating(rating: number, region: string, eliteRating: number | null = null) {
  if (eliteRating !== null && rating >= eliteRating) return 'sixth'

  const division = getDivisionByRating(rating, region)
  if (division == 'qual') return 'qual'

  return division.split('_')[0] as 'first' | 'second' | 'third' | 'fourth' | 'fifth'
}

const possibleLetters = new Set(['E', 'D', 'C', 'B', 'A'])
export function getDivisionLetterByRating(rating: number, region: string) {
  const division = getDivisionByRating(rating, region)
  if (division == 'qual') return '?'

  const letter = division.split('_')[1]
  if (possibleLetters.has(letter)) return letter as 'E' | 'D' | 'C' | 'B' | 'A'
  return ''
}