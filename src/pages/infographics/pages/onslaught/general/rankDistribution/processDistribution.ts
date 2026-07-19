import type { DivisionLetter, Rank } from '@/shared/game/comp7/utils'
import type { RankDistributionItem } from './types'

type DistributionRow = {
  rank: Exclude<Rank, 'qual'>
  division: DivisionLetter | number
  players: number
}

type LeaderboardRank = Extract<Rank, 'fifth' | 'sixth'>
type RatingEntry = [rating: number, players: number]
type LeaderboardRatings = Record<LeaderboardRank, RatingEntry[]>

export const LEADERBOARD_STEP = 10
const MAX_BARS_PER_RANK = 10
const NICE_STEPS = [
  LEADERBOARD_STEP, 20, 25, 50,
  100, 200, 250, 500,
  1000, 2000, 2500, 5000,
  10000, 20000, 25000, 50000,
] as const

function isLeaderboardRank(rank: DistributionRow['rank']): rank is LeaderboardRank {
  return rank === 'fifth' || rank === 'sixth'
}

function aggregateRatings(
  rank: LeaderboardRank,
  entries: RatingEntry[],
  step: number,
): RankDistributionItem[] {
  if (entries.length === 0) return []

  const firstRating = entries[0][0]
  const buckets = new Map<number, number>()

  for (const [rating, players] of entries) {
    const bucket = firstRating + Math.floor((rating - firstRating) / step) * step
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + players)
  }

  return [...buckets].map(([name, value]) => ({
    rank,
    name,
    value,
    ratingInterval: [name, name + step - 1],
  }))
}

function tryCollapseSixthTail(items: RankDistributionItem[]): RankDistributionItem[] | null {
  if (items.length < 2) return items

  let tailValue = 0

  for (let tailStart = items.length - 1; tailStart > 0; tailStart--) {
    tailValue += items[tailStart].value
    const precedingItem = items[tailStart - 1]
    if (tailStart >= MAX_BARS_PER_RANK || tailValue > precedingItem.value) continue

    const firstTailItem = items[tailStart]
    const lastTailItem = items[items.length - 1]
    return [
      ...items.slice(0, tailStart),
      {
        ...firstTailItem,
        label: `${Number(firstTailItem.name) - LEADERBOARD_STEP}+`,
        value: tailValue,
        ratingInterval: [
          firstTailItem.ratingInterval?.[0] ?? Number(firstTailItem.name),
          lastTailItem.ratingInterval?.[1] ?? Number(lastTailItem.name),
        ],
      },
    ]
  }

  return null
}

function processLeaderboardRatings(ratings: LeaderboardRatings): RankDistributionItem[] {
  let fallbackItems: RankDistributionItem[] = []

  for (const step of NICE_STEPS) {
    const fifthItems = aggregateRatings('fifth', ratings.fifth, step)
    const sixthBuckets = aggregateRatings('sixth', ratings.sixth, step)
    const collapsedSixthItems = tryCollapseSixthTail(sixthBuckets)

    fallbackItems = [...fifthItems, ...(collapsedSixthItems ?? sixthBuckets)]
    if (fifthItems.length <= MAX_BARS_PER_RANK && collapsedSixthItems) {
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

  const leaderboardRatings: LeaderboardRatings = {
    fifth: [],
    sixth: [],
  }

  for (const [rating, playersByRank] of byRating) {
    const rank = playersByRank.sixth > playersByRank.fifth ? 'sixth' : 'fifth'
    leaderboardRatings[rank].push([rating, playersByRank.fifth + playersByRank.sixth])
  }

  for (const entries of Object.values(leaderboardRatings)) {
    entries.sort(([ratingA], [ratingB]) => ratingA - ratingB)
  }

  return { divisionItems, leaderboardRatings }
}

export function processDistribution(data: DistributionRow[]): RankDistributionItem[] {
  const { divisionItems, leaderboardRatings } = splitDistribution(data)

  return [...divisionItems, ...processLeaderboardRatings(leaderboardRatings)]
}
