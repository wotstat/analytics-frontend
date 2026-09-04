
import { GameVendor } from '@/shared/game/wot'
import { STATIC_URL } from '@/shared/external/externalUrl'
import { getArtefactName } from '@/shared/i18n/i18n'

const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR
const LESTA_SEASON_LENGTH = 49 * ONE_DAY
const WG_SEASON_LENGTH = 40 * ONE_DAY
const SEASON_LENGTHS = {
  'ru:comp7_5_2': 14 * ONE_DAY, // более короткий тк запись модом началась не с начала натиска, а с середины сезона
  'eu:comp7_5_2': 40 * ONE_DAY,
  'na:comp7_5_3': 41 * ONE_DAY, // в NA сезон 41 день
  'asia:comp7_5_3': 42 * ONE_DAY, // в ASIA сезон 42 день
  'ru:comp7_5_4': 42 * ONE_DAY,

  'ru:comp7_6_1': ['2026-01-02', '2026-02-21'], // https://tanki.su/ru/news/game-events/natisk-ognennyj-sokol/
  'eu:comp7_6_1': ['2026-01-02', '2026-02-11'], // https://worldoftanks.eu/en/news/general-news/onslaught-season-of-the-phoenix-1/
  'na:comp7_6_1': ['2026-01-02', '2026-02-11'], // https://worldoftanks.com/en/news/general-news/onslaught-season-of-the-phoenix-1/
  'asia:comp7_6_1': ['2026-01-02', '2026-02-11'], // https://worldoftanks.com/en/news/general-news/onslaught-season-of-the-phoenix-1/
}

const SEASON_SKILL_CHANGE = {
  'ru:comp7_5_4': true,
  'ru:comp7_6_1': true
}

export function isComp7SkillChangeSupported(region: string, season: string) {
  return SEASON_SKILL_CHANGE[`${region.toLowerCase()}:${season}` as keyof typeof SEASON_SKILL_CHANGE] ?? false
}

/* Сдвиг времени относительно UTC для переключения дня, переключение ближе к НАЧАЛУ следующего дня.
Используется как toStartOfDay(recalculationTime - interval OFFSET hour)

Проверять так:
with
    -8 as OFFSET,
    30 as STEP
select toStartOfInterval(dateTime, interval STEP minute) as t,
       toStartOfDay(t + interval OFFSET hour) as g,
       toUInt32(count()) as count
from Event_OnBattleStart
where battleMode = 'COMP7' and region = 'ASIA' and dateTime > '2026-03-08'
group by t
order by t with fill step interval STEP minute
*/
const REGION_TIME_OFFSETS: Record<string, number> = {
  'RU': -3,
  'EU': -9,
  'ASIA': -8,
  'NA': -20,
  'CN': -4
}

// Сдвиг времени относительно UTC для визуальной смены дня в UI. new Date(recalculationTime) + OFFSET
const REGION_TIME_DAY_CHANGE_OFFSETS: Record<string, number> = {
  'RU': 0.5, // Прайм тайм до 3:30 по МСК = 0:30 UTC
  'EU': 0, // Сдвига действительно нет, прайм по UTC
  'ASIA': 0,
  'NA': 7, // На самом деле прайм до +6 (23:00PT), но чтоб переход через день совпадал с календарным, ставим +7 (00:00PT)
  'CN': 0
}

export function getSeasonDuration(season: string, region: string) {
  const overrideLength = SEASON_LENGTHS[`${region.toLowerCase()}:${season}` as keyof typeof SEASON_LENGTHS]

  if (Array.isArray(overrideLength)) {
    const [start, end] = overrideLength
    const startDate = new Date(start)
    const endDate = new Date(end)
    const duration = endDate.getTime() - startDate.getTime()
    return Math.round(duration / ONE_DAY) * ONE_DAY
  }

  const seasonLength = overrideLength ?? (region == 'RU' ? LESTA_SEASON_LENGTH : WG_SEASON_LENGTH)
  return seasonLength
}

const RU_QUALIFICATION_COUNT = 7
const EU_QUALIFICATION_COUNT = 10
export function getSeasonQualificationCount(season: string, region: string) {
  if (region == 'RU') return RU_QUALIFICATION_COUNT
  if (region == 'EU') return EU_QUALIFICATION_COUNT
  return 0
}

export function getRegionIsoHourOffset(region: string) {
  return REGION_TIME_OFFSETS[region.toUpperCase()] ?? -3
}

export function getRegionDayChangeHourOffset(region: string) {
  return ONE_HOUR * (REGION_TIME_DAY_CHANGE_OFFSETS[region.toUpperCase()] ?? 0)
}

export function getMaxEnergyLimit(game: GameVendor = 'mt'): number {
  return game == 'mt' ? 7 : 14
}

export function getEnergyPerBattle(lastMaxRank: Rank, rankBeforeBattle: Rank, rankAfterBattle: Rank, game: GameVendor = 'mt'): number {
  if (game == 'mt') {
    const additionalEnergy = compareRanks('second', rankAfterBattle) < 0 && compareRanks(lastMaxRank, rankAfterBattle) < 0 ? 2 : 0
    switch (rankBeforeBattle) {
      case 'qual': return 0
      case 'first': return 0
      case 'second': return additionalEnergy
      case 'third': return additionalEnergy + 5
      case 'fourth': return additionalEnergy + 5
      case 'fifth': return additionalEnergy + 1
      case 'sixth': return additionalEnergy + 1
      default: return 0 as never
    }
  } else {
    return 1
  }
}

export function getRatingInactiveDecreasePerDay(rank: Rank, game: GameVendor = 'mt'): number {
  if (game == 'mt') {
    switch (rank) {
      case 'qual': return 0
      case 'first': return 0
      case 'second': return 0
      case 'third': return 15
      case 'fourth': return 25
      case 'fifth': return 50
      case 'sixth': return 100
      default: return 0 as never
    }
  } else {
    switch (rank) {
      case 'qual': return 0
      case 'first': return 0
      case 'second': return 0
      case 'third': return 20
      case 'fourth': return 25
      case 'fifth': return 50
      case 'sixth': return 75
      default: return 0 as never
    }
  }
}

export type Rank = 'qual' | 'first' | 'second' | 'third' | 'fourth' | 'fifth' | 'sixth'
export type DivisionLetter = 'E' | 'D' | 'C' | 'B' | 'A' | ''
export type EliteDivisionLetter = 'C' | 'B' | 'A'
export type Division = `${Exclude<Rank, 'qual' | 'sixth' | 'fifth'>}_${Exclude<DivisionLetter, ''>}`
  | `${'fifth' | 'sixth'}_${EliteDivisionLetter}` | 'qual' | 'fifth' | 'sixth'

export type EliteRating = number | Record<EliteDivisionLetter, number>

const RANK_ORDER: Rank[] = ['qual', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']

export function hasEliteDivisions(game: GameVendor = 'mt', season: string = 'latest'): boolean {
  if (game !== 'mt') return false
  if (season === 'latest') return true
  const match = /^comp7_(\d+)_(\d+)$/.exec(season)
  return !!match && (Number(match[1]) > 6 || (Number(match[1]) === 6 && Number(match[2]) >= 1))
}

export const ranksLestaMap: Record<number, Division> = {
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
  2650: 'fifth'
}

export const rankWgMap: Record<number, Division> = {
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
  2000: 'fifth'
}

// https://tanki.su/ru/content/guide/game-events-rules/onslaught_guide/
const ranksLestaDivisionsMap: Record<number, Division> = {
  ...ranksLestaMap,
  2650: 'fifth_C',
  3050: 'fifth_B',
  3450: 'fifth_A'
}

function getRatingMap(game: GameVendor, season: string) {
  if (game === 'wot') return rankWgMap
  return hasEliteDivisions(game, season) ? ranksLestaDivisionsMap : ranksLestaMap
}

function getEliteThreshold(eliteRating: EliteRating | null): number {
  const threshold = typeof eliteRating === 'number' ? eliteRating : eliteRating?.C
  return threshold && threshold > 0 ? threshold : Infinity
}

export function compareRanks(rank1: Rank, rank2: Rank): number {
  return RANK_ORDER.indexOf(rank1) - RANK_ORDER.indexOf(rank2)
}

export function getDivisionByRating(rating: number, game: GameVendor = 'mt', eliteRating: EliteRating | null = null,
  season: string = 'latest'): Division {
  if (rating == 0) return 'qual'
  if (rating >= getEliteThreshold(eliteRating)) {
    if (hasEliteDivisions(game, season) && eliteRating !== null && typeof eliteRating === 'object'
      && Number.isFinite(eliteRating.A) && eliteRating.A >= eliteRating.B && eliteRating.B >= eliteRating.C) {
      if (rating >= eliteRating.A) return 'sixth_A'
      if (rating >= eliteRating.B) return 'sixth_B'
      return 'sixth_C'
    }
    return 'sixth'
  }
  const targetMap = getRatingMap(game, season)
  const key = Object.keys(targetMap).reverse().find(key => rating >= parseInt(key))
  return key ? targetMap[parseInt(key) as keyof typeof targetMap] : 'first_E'
}

export function getRankByRating(rating: number, game: GameVendor = 'mt', eliteRating: EliteRating | null = null, season: string = 'latest'): Rank {
  return getDivisionByRating(rating, game, eliteRating, season).split('_')[0] as Rank
}

export function getNextDivision(currentDivision: Division, game: GameVendor = 'mt', season: string = 'latest'): Division | null {
  if (currentDivision == 'fifth') return 'sixth'
  if (currentDivision == 'sixth') return null
  const divisions = RANK_ORDER.flatMap(rank => getDivisionsByRank(rank, game, season))
  const index = divisions.indexOf(currentDivision)
  return index < 0 ? null : divisions[index + 1] ?? null
}

export function getPrevDivision(currentDivision: Division, game: GameVendor = 'mt', season: string = 'latest'): Division | null {
  if (currentDivision == 'fifth') return 'fourth_A'
  if (currentDivision == 'sixth') return hasEliteDivisions(game, season) ? 'fifth_A' : 'fifth'
  const divisions = RANK_ORDER.flatMap(rank => getDivisionsByRank(rank, game, season))
  return divisions[divisions.indexOf(currentDivision) - 1] ?? null
}

export function getDivisionsByRank(rank: Rank, game: GameVendor = 'mt', season: string = 'latest'): Division[] {
  if (rank == 'qual') return [rank]
  if (rank == 'sixth' || rank == 'fifth') {
    return hasEliteDivisions(game, season) ? [`${rank}_C`, `${rank}_B`, `${rank}_A`] : [rank]
  }
  const letters: DivisionLetter[] = ['E', 'D', 'C', 'B', 'A']
  return letters.map(letter => `${rank}_${letter}` as Division)
}

export function getRatingForDivision(division: Division, game: GameVendor = 'mt', season: string = 'latest',
  eliteRating: EliteRating | null = null): number {
  if (division == 'qual') return 0
  if (division == 'first_E') return 0
  if (division == 'fifth') return game === 'mt' ? 2650 : 2000
  if (division == 'sixth' || division == 'sixth_C') return getEliteThreshold(eliteRating)
  if (division == 'sixth_B' || division == 'sixth_A') {
    const threshold = typeof eliteRating === 'object' && eliteRating !== null
      ? eliteRating[division.split('_')[1] as EliteDivisionLetter] : null
    return threshold && threshold > 0 ? threshold : Infinity
  }
  const entry = Object.entries(getRatingMap(game, season)).find(([, value]) => value === division)
  return entry ? Number(entry[0]) : Infinity
}

export function getRatingIntervalForDivision(division: Division, game: GameVendor = 'mt', season: string = 'latest',
  eliteRating: EliteRating | null = null): [number, number] {
  if (division == 'qual') return [0, 0]

  const startRating = getRatingForDivision(division, game, season, eliteRating)

  const nextDivision = getNextDivision(division, game, season)
  if (!nextDivision) return [startRating, Infinity]

  const nextRating = getRatingForDivision(nextDivision, game, season, eliteRating)
  const endRating = division.startsWith('fifth') ? Math.min(nextRating, getEliteThreshold(eliteRating)) : nextRating
  return [startRating, endRating - 1]
}

const possibleLetters = new Set(['E', 'D', 'C', 'B', 'A'])
export function getDivisionLetterByRating(rating: number, game: GameVendor = 'mt', season: string = 'latest',
  eliteRating: EliteRating | null = null): DivisionLetter | '?' {
  const division = getDivisionByRating(rating, game, eliteRating, season)
  if (division == 'qual') return '?'

  const letter = division.split('_')[1]
  if (possibleLetters.has(letter)) return letter as 'E' | 'D' | 'C' | 'B' | 'A'
  return ''
}

export type RankImageDefinition = number | { value: number, eliteRating: EliteRating } | Rank | Division | [rating: number, eliteRating: EliteRating]

function resolveRankImage(rank: RankImageDefinition, game: GameVendor, season: string): Rank | Division {
  let division: Rank | Division
  if (typeof rank === 'number') division = getDivisionByRating(rank, game, null, season)
  else if (Array.isArray(rank)) division = getDivisionByRating(rank[0], game, rank[1], season)
  else if (typeof rank === 'object') division = getDivisionByRating(rank.value, game, rank.eliteRating, season)
  else division = rank

  if (!hasEliteDivisions(game, season) && /^(fifth|sixth)_[CBA]$/.test(division)) {
    return division.split('_')[0] as Rank
  }
  return division
}

function getRankImageName(rank: RankImageDefinition, game: GameVendor, season: string): string {
  const division = resolveRankImage(rank, game, season)

  if (division == 'qual') return 'qualification'
  if (division == 'sixth' && game == 'mt') return 'sixth_logo'
  if (division == 'fifth' && game == 'mt') return 'fifth_logo'
  return division
}

export function rankImageUrl(rank: RankImageDefinition,
  size: 'small' | 'medium' | 'large' = 'medium',
  game: GameVendor = 'mt',
  season: 'latest' | (string & {}) = 'latest',
  format: 'webp' | 'png' = 'webp') {
  const gamePrefix = game === 'mt' ? 'mt' : 'wot'
  let name = getRankImageName(rank, game, season)

  if (size == 'small') {
    name = name.split('_')[0] // для маленького размера убираем букву дивизиона, т.к. в иконках для маленького размера она не отображается
  }

  switch (size) {
    case 'small': return `${STATIC_URL}/${gamePrefix}/latest/comp7/ranks/${season}/small/${name}.${format}`
    case 'medium': return `${STATIC_URL}/${gamePrefix}/latest/comp7/ranks/${season}/medium/${name}.${format}`
    case 'large': return `${STATIC_URL}/${gamePrefix}/latest/comp7/ranks/${season}/large/${name}.${format}`
  }
}

export function rankImageFallbackUrl(rank: RankImageDefinition,
  size: 'small' | 'medium' | 'large' = 'medium',
  game: GameVendor = 'mt',
  season: string = 'latest',
  format: 'webp' | 'png' = 'webp') {
  return rankImageUrl(resolveRankImage(rank, game, season), size, game, 'latest', format)
}

export const SKILL_TAGS = [
  'comp7_aggressive_detection',
  'comp7_ally_support',
  'comp7_aoe_heal',
  'comp7_aoe_inspire',
  'comp7_berserk',
  'comp7_concentration',
  'comp7_fast_recharge',
  'comp7_hunter',
  'comp7_juggernaut',
  'comp7_march',
  'comp7_recon',
  'comp7_redline',
  'comp7_risky_attack',
  'comp7_sniper',
  'comp7_sure_shot',
] as const

export type SkillTag = typeof SKILL_TAGS[number]

export function getComp7SkillName(tag: string) {
  return getArtefactName(tag) ?? tag
}

export function skillImageUrl(tag: SkillTag | (string & {}),
  game: GameVendor = 'mt',
  season: 'latest' | (string & {}) = 'latest',
  format: 'webp' | 'png' = 'webp') {

  const gamePrefix = game === 'mt' ? 'mt' : 'wot'
  return `${STATIC_URL}/${gamePrefix}/latest/comp7/skills/${season}/${tag}.${format}`
}
