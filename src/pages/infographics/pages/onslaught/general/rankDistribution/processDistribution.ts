import type { DivisionLetter, Rank } from '@/shared/game/comp7/utils'
import type { RankDistributionItem } from './types'

type DistributionRow = {
  rank: Exclude<Rank, 'qual'>
  division: DivisionLetter | number
  players: number
}

type LeaderboardRank = Extract<Rank, 'fifth' | 'sixth'>
type LeaderboardRating = {
  rating: number
  players: Record<LeaderboardRank, number>
}

export const LEADERBOARD_STEP = 10
const MAX_BARS_PER_RANK = 10
const MAX_COLLAPSED_TAIL_SHARE = 0.07
const NICE_STEPS = [
  LEADERBOARD_STEP, 20, 50,
  100, 200, 250, 500,
  1000, 2000, 2500, 5000,
  10000, 20000, 25000, 50000,
] as const

function isLeaderboardRank(rank: DistributionRow['rank']): rank is LeaderboardRank {
  return rank === 'fifth' || rank === 'sixth'
}

function aggregateRatings(
  entries: LeaderboardRating[],
  step: number,
  anchor: number,
): RankDistributionItem[] {
  if (entries.length === 0) return []

  const buckets = new Map<number, Record<LeaderboardRank, number>>()

  for (const { rating, players } of entries) {
    const bucketStart = anchor + Math.floor((rating - anchor) / step) * step
    const bucket = buckets.get(bucketStart) ?? { fifth: 0, sixth: 0 }
    bucket.fifth += players.fifth
    bucket.sixth += players.sixth
    buckets.set(bucketStart, bucket)
  }

  return [...buckets].map(([name, players]) => ({
    rank: players.sixth > players.fifth ? 'sixth' : 'fifth',
    name,
    value: players.fifth + players.sixth,
    ratingInterval: [name, name + step - 1],
  }))
}

function tryCollapseLegendTail(items: RankDistributionItem[]): RankDistributionItem[] | null {
  if (items.length < 2) return items

  const totalValue = items.reduce((sum, item) => sum + item.value, 0)
  let tailValue = 0
  let shareTailStart: number | null = null

  for (let tailStart = items.length - 1; tailStart > 0; tailStart--) {
    const nextTailValue = tailValue + items[tailStart].value
    if (nextTailValue / totalValue >= MAX_COLLAPSED_TAIL_SHARE) break

    tailValue = nextTailValue
    shareTailStart = tailStart
  }

  const limitTailStart = items.length > MAX_BARS_PER_RANK
    ? MAX_BARS_PER_RANK - 1
    : null
  const tailStart = [shareTailStart, limitTailStart]
    .filter((value): value is number => value !== null)
    .reduce<number | null>((min, value) => min === null ? value : Math.min(min, value), null)

  if (tailStart === null) return null

  const firstTailItem = items[tailStart]
  const lastTailItem = items[items.length - 1]
  const tailStartRating = firstTailItem.ratingInterval?.[0] ?? Number(firstTailItem.name)

  return [
    ...items.slice(0, tailStart),
    {
      ...firstTailItem,
      label: `${tailStartRating}+`,
      value: items.slice(tailStart).reduce((sum, item) => sum + item.value, 0),
      ratingInterval: [
        tailStartRating,
        lastTailItem.ratingInterval?.[1] ?? Number(lastTailItem.name),
      ],
    },
  ]
}

function processLeaderboardRatings(ratings: LeaderboardRating[], anchor: number): RankDistributionItem[] {
  let fallbackItems: RankDistributionItem[] = []

  for (const step of NICE_STEPS) {
    const items = aggregateRatings(ratings, step, anchor)
    const championItems = items.filter(item => item.rank === 'fifth')
    const legendItems = items.filter(item => item.rank === 'sixth')
    const collapsedLegendItems = tryCollapseLegendTail(legendItems)
    const displayedLegendItems = collapsedLegendItems ?? legendItems

    fallbackItems = [...championItems, ...displayedLegendItems]
    if (championItems.length <= MAX_BARS_PER_RANK && displayedLegendItems.length <= MAX_BARS_PER_RANK) {
      return fallbackItems
    }
  }

  return fallbackItems
}

function splitDistribution(data: DistributionRow[]) {
  const divisionItems: RankDistributionItem[] = []
  const byRating = new Map<number, Record<LeaderboardRank, number>>()

  for (const item of data) {
    if (!isLeaderboardRank(item.rank)) {
      divisionItems.push({
        rank: item.rank,
        name: item.division,
        value: item.players,
      })
      continue
    }

    if (typeof item.division !== 'number') continue
    const playersByRank = byRating.get(item.division) ?? { fifth: 0, sixth: 0 }
    playersByRank[item.rank] += item.players
    byRating.set(item.division, playersByRank)
  }

  const leaderboardRatings = [...byRating]
    .map(([rating, players]) => ({ rating, players }))
    .sort((a, b) => a.rating - b.rating)

  return { divisionItems, leaderboardRatings }
}

export function processDistribution(data: DistributionRow[], leaderboardStartRating: number): RankDistributionItem[] {
  const { divisionItems, leaderboardRatings } = splitDistribution(data)

  return [...divisionItems, ...processLeaderboardRatings(leaderboardRatings, leaderboardStartRating)]
}
