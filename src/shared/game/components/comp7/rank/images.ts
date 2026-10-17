import { STATIC_URL } from '@/shared/external/externalUrl'
import type { GameVendor } from '@/shared/game/domain/wot'
import { getDivisionByRating, getMaxDivisionByRank, hasEliteDivisions, type EliteRating, type Rank, type Division } from '@/shared/game/domain/comp7/utils'

export type RankImageDefinition = number | { value: number, eliteRating: EliteRating } | Rank | Division | `${Rank}_hero` | [rating: number, eliteRating: EliteRating]

function resolveRankImage(rank: RankImageDefinition, game: GameVendor, season: string): Rank | Division {
  let division: Rank | Division
  if (typeof rank === 'number') division = getDivisionByRating(rank, game, null, season)
  else if (Array.isArray(rank)) division = getDivisionByRating(rank[0], game, rank[1], season)
  else if (typeof rank === 'object') division = getDivisionByRating(rank.value, game, rank.eliteRating, season)
  else if (rank.endsWith('_hero')) division = getMaxDivisionByRank(rank.split('_')[0] as Rank, game, season)
  else division = rank as Rank | Division

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
