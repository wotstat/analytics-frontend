import { IMMUTABLE_CACHE, queryAsync, queryComputed, success, type QueryOptions, type Status } from '@/db'
import { computed, watch, type Ref } from 'vue'
import { bloggerGameIdArrayToArray, bloggerGameIdToIndex, bloggerNameByGameId, bloggerRecordToArray, bloggerTimeSeriesProcess } from './bloggerNames'
import { useLocalStorage } from '@vueuse/core'
import { crossTablePeriod } from '../store'

const queryOptions = {
  cache: IMMUTABLE_CACHE,
  proxyCache: true,
} satisfies QueryOptions

export const periodVariants = [
  { value: 'day1', label: 'День 1' },
  { value: 'day2', label: 'День 2' },
  { value: 'day3', label: 'День 3' },
  { value: 'day4', label: 'День 4' },
  { value: 'day5', label: 'День 5' },
  { value: 'day6', label: 'День 6' },
  { value: 'day7', label: 'День 7' },
  { value: 'day8', label: 'День 8' },
  { value: 'day9', label: 'День 9' },
  { value: 'day10', label: 'День 10' },
  { value: 'all', label: 'Всё время' },
] as const

export const stepVariants = [
  { value: 'sec5', label: 'По 5 сек' },
  { value: 'sec10', label: 'По 10 сек' },
  { value: 'min1', label: 'По 1 мин' },
  { value: 'min3', label: 'По 3 мин' },
  { value: 'min10', label: 'По 10 мин' },
  { value: 'min30', label: 'По 30 мин' },
  { value: 'hour1', label: 'По 1 часу' },
  { value: 'day', label: 'По дням' },
] as const

const stepToInterval = {
  'sec5': 5,
  'sec10': 10,
  'min1': 60,
  'min3': 180,
  'min10': 600,
  'min30': 60 * 30,
  'hour1': 60 * 60,
  'day': 60 * 60 * 24,
}

const DAY = 60 * 60 * 24
const PLAY = 60 * 60 * 18
const START = 1738908000 - 60 * 60
const periodToInterval = {
  'all': () => [START, START + 9 * DAY + PLAY],
  'day1': () => [START, START + PLAY],
  'day2': () => [START + DAY, START + DAY + PLAY],
  'day3': () => [START + DAY * 2, START + DAY * 2 + PLAY],
  'day4': () => [START + DAY * 3, START + DAY * 3 + PLAY],
  'day5': () => [START + DAY * 4, START + DAY * 4 + PLAY],
  'day6': () => [START + DAY * 5, START + DAY * 5 + PLAY],
  'day7': () => [START + DAY * 6, START + DAY * 6 + PLAY],
  'day8': () => [START + DAY * 7, START + DAY * 7 + PLAY],
  'day9': () => [START + DAY * 8, START + DAY * 8 + PLAY],
  'day10': () => [START + DAY * 9, START + DAY * 9 + PLAY],
}


export const period = useLocalStorage<typeof periodVariants[number]['value']>('bob25-selected-chart-period', 'all')
export const step = useLocalStorage<typeof stepVariants[number]['value']>('bob25-selected-chart-step', 'min10')

for (const selection of [period, crossTablePeriod]) {
  watch(selection, value => {
    if (!periodVariants.some(variant => variant.value === value)) selection.value = 'all'
  }, { immediate: true })
}

function useBloggerChart(sql: (from: number, to: number, step: number) => string, visible: Ref<boolean>) {
  const result = queryComputed<{ bloggerId: number, value: number, t: number }>(() => {
    const [from, to] = periodToInterval[period.value]()
    return sql(from, to, stepToInterval[step.value])
  }, { ...queryOptions, enabled: visible })

  return computed(() => {
    const { data } = result.value
    if (!data.length) return { data: [[], [], [], []], labels: [] }

    const [from, to] = periodToInterval[period.value]()
    return bloggerTimeSeriesProcess(data, {
      from: period.value === 'all' ? data[0].t : from,
      to,
      step: stepToInterval[step.value],
    })
  })
}

function useBloggerTotals(sql: string) {
  const result = queryAsync<{ bloggerId: number, value: number }>(sql, queryOptions)
  return computed(() => {
    const byBlogger = Object.groupBy(result.value.data, row => bloggerNameByGameId(row.bloggerId))
    return bloggerRecordToArray(byBlogger).map(rows => rows?.[0]?.value ?? 0)
  })
}

export function useTotalPlayers() {
  return useBloggerTotals(`
    select bloggerId, argMax(count, dateTime) as value
    from BOB25.TotalPlayers
    group by bloggerId
  `)
}

export function useTotalWinrate() {
  return useBloggerTotals(`
    select bloggerId, countMerge(wins) / countMerge(battles) as value
    from BOB25.Battles
    group by bloggerId
  `)
}

export function useTotalBattles() {
  return useBloggerTotals(`
      with
          sum(n1) as n1, sum(n2) as n2, sum(n3) as n3, sum(n4) as n4,
          n1 + n2 + n3 + n4 as nRep,
          if(n1 = 0, 0, 1 - power(1 - (((n2 / n1) / 6.5) / (1 + ((n2 / n1) / 6.5))) , 14)) as probObserved,
          if(probObserved = 0, 0, nRep / probObserved) as total
      select
          bloggerId,
          round(total) as value
      from BOB25.ModdedPlayerBattles
      group by bloggerId
      order by bloggerId;
  `)
}

export function useTotalBattlesChart(visible: Ref<boolean>) {
  const data = useBloggerChart((from, to, step) => `
      with
        sum(n1) as n1, sum(n2) as n2, sum(n3) as n3, sum(n4) as n4,
        n1 + n2 + n3 + n4 as nRep,
        if(n1 = 0, 0, 1 - power(1 - (((n2 / n1) / 6.5) / (1 + ((n2 / n1) / 6.5))) , 14)) as probObserved,
        if(probObserved = 0, 0, nRep / probObserved) as total,
        n2 as total2
      select
        bloggerId,
        toUnixTimestamp(toStartOfInterval(dateTime, interval ${step} second)) as t,
        round(total) as value
      from BOB25.ModdedPlayerBattles
      where dateTime between ${from} and ${to + step}
      group by bloggerId, t
      having probObserved > 0.1
      order by bloggerId, t
    `, visible)

  return computed(() => {
    const { labels } = data.value
    return {
      data: data.value.data.map(series => series.map((value, i) =>
        labels[i] > 1739469480 && labels[i] < 1739470860 ? null : value)),
      labels,
    }
  })

}

export function useTotalPlayersChart(visible: Ref<boolean>) {
  return useBloggerChart((from, to, step) => `
      select
        bloggerId,
        toUnixTimestamp(toStartOfInterval(dateTime, interval ${step} second)) as t,
        max(count) as value
      from BOB25.TotalPlayers
      where dateTime between ${from} and ${to + step}
      group by t, bloggerId
      order by bloggerId, t
    `, visible)
}

export function useTotalScore() {
  const result = queryAsync<{ b1: number, b2: number, b3: number, b4: number }>(`
      select
        dateTime,
        quantileMerge(0.5)(b1Score) as b1,
        quantileMerge(0.5)(b2Score) as b2,
        quantileMerge(0.5)(b3Score) as b3,
        quantileMerge(0.5)(b4Score) as b4
      from BOB25.Scores
      where dateTime = (select max(dateTime) from BOB25.Scores)
      group by dateTime;
  `, queryOptions)

  return computed(() => {
    const score = result.value.data[0]
    if (!score) return [0, 0, 0, 0]
    return bloggerGameIdArrayToArray([score.b1, score.b2, score.b3, score.b4]).map(value => value ?? 0)
  })
}

export function useTotalScoreChart(visible: Ref<boolean>) {
  return useBloggerChart((from, to, step) => `
      with
          prepare as (
              with
                  quantileMerge(0.7)(b1Score) as b1,
                  quantileMerge(0.7)(b2Score) as b2,
                  quantileMerge(0.7)(b3Score) as b3,
                  quantileMerge(0.7)(b4Score) as b4
              select dateTime, b1, b2, b3, b4
              from BOB25.Scores
              where dateTime between ${from} and ${to + step}
              group by dateTime
          )
      select
          bloggerId,
          toUnixTimestamp(toStartOfInterval(dateTime, interval ${step} second)) as t,
          argMax(score, t) as value
      from prepare
      array join [b1, b2, b3, b4] as score, [1, 2, 3, 4] as bloggerId
      group by bloggerId, t
      order by bloggerId, t
  `, visible)
}

export function useAvgBattleDuration() {
  return useBloggerTotals(`
    select bloggerId, avgMerge(duration) as value
    from BOB25.Battles
    group by bloggerId
  `)
}

export function useAvgBattleDurationChart(visible: Ref<boolean>) {
  return useBloggerChart((from, to, step) => `
      select
        bloggerId,
        toUnixTimestamp(toStartOfInterval(dateTime, interval ${step} second)) as t,
        avgMerge(duration) as value
      from BOB25.Battles
      where dateTime between ${from} and ${to + step}
      group by t, bloggerId
      having countMerge(battles) > 50
      order by bloggerId, t
    `, visible)
}

export function useWinrateChart(visible: Ref<boolean>) {
  return useBloggerChart((from, to, step) => `
      select
        bloggerId,
        toUnixTimestamp(toStartOfInterval(dateTime, interval ${step} second)) as t,
        toFloat32(countMerge(wins)/countMerge(battles)) as value
      from BOB25.Battles
      where dateTime between ${from} and ${to + step}
      group by t, bloggerId
      having countMerge(battles) > 50
      order by bloggerId, t
    `, visible)
}

export function usePopularTanks() {
  const data = queryAsync<{ bloggerId: number, tankTag: string, percent: number }>(`
    select bloggerId, tankTag,
      countMerge(battles) as battles,
      battles / sum(battles) over (partition by bloggerId) as percent,
      avgMerge(score)
    from BOB25.Vehicles
    group by bloggerId, tankTag
    order by bloggerId, percent desc
    limit 30 by bloggerId;
  `, queryOptions)

  return computed(() => {
    if (data.value.status != success) return { status: data.value.status as Status, data: undefined }
    const byBlogger = Object.groupBy(data.value.data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { tankTag: string, percent: number }[]>

    const result = bloggerRecordToArray(byBlogger)
      .map(tanks => tanks?.map(t => ({ tag: t.tankTag, value: t.percent })))

    return { status: data.value.status as Status, data: result }
  })
}

export function useScoredTanks() {
  const data = queryAsync<{ bloggerId: number, tankTag: string, score: number }>(`
    select bloggerId, tankTag,
      avgMerge(score) as score
    from BOB25.Vehicles
    group by bloggerId, tankTag
    having countMerge(battles) > 100
    order by bloggerId, score desc
    limit 30 by bloggerId;
  `, queryOptions)

  return computed(() => {
    if (data.value.status != success) return { status: data.value.status as Status, data: undefined }
    const byBlogger = Object.groupBy(data.value.data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { tankTag: string, score: number }[]>

    const result = bloggerRecordToArray(byBlogger)
      .map(tanks => tanks?.map(t => ({ tag: t.tankTag, value: t.score })))

    return { status: data.value.status as Status, data: result }
  })
}

export function useScoredPopularTanks() {
  const data = queryAsync<{ bloggerId: number, tankTag: string, score: number }>(`
    with
        topTanks as (
            select tankTag
            from BOB25.Vehicles
            group by bloggerId, tankTag
            order by countMerge(battles) desc
            limit 30 by bloggerId
        )
    select bloggerId, tankTag,
      avgMerge(score) as score
    from BOB25.Vehicles
    where tankTag in topTanks
    group by bloggerId, tankTag
    having countMerge(battles) > 100
    order by bloggerId, score desc
    limit 30 by bloggerId
  `, queryOptions)

  return computed(() => {
    if (data.value.status != success) return { status: data.value.status as Status, data: undefined }
    const byBlogger = Object.groupBy(data.value.data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { tankTag: string, score: number }[]>

    const result = bloggerRecordToArray(byBlogger)
      .map(tanks => tanks?.map(t => ({ tag: t.tankTag, value: t.score })))

    return { status: data.value.status as Status, data: result }
  })
}

export function useCrossTables() {
  const result = queryComputed<{ t1: number, t2: number, winrate: number, battlesPercent: number }>(() => {
    const [from, to] = periodToInterval[crossTablePeriod.value]()
    return `
      with
        distinctBattleResults as (
            with
                CAST(extra.bob.allyBloggerId, 'UInt8') AS allyBloggerId,
                CAST(extra.bob.enemyBloggerId, 'UInt8') AS enemyBloggerId
            select enemyBloggerId,
                  allyBloggerId,
                  arenaId,
                  result == 'win' as win
            from WOT.Event_OnBattleResult
            where battleMode = 'BOB' and enemyBloggerId != 0 and allyBloggerId != 0
            and dateTime between ${from} and ${to}
            limit 1 by arenaId
        ),
        joined as (
            select allyBlog, enemyBlog, win
            from distinctBattleResults
            array join [allyBloggerId, enemyBloggerId] as allyBlog,
                      [enemyBloggerId, allyBloggerId] as enemyBlog,
                      [win, not win] as win
        )
      select allyBlog as t1, enemyBlog as t2,
            countIf(win) / count() as winrate,
            count() / sum(count()) over (partition by t1) as battlesPercent
      from joined
      group by t1, t2
      order by t1, t2;
    `
  }, queryOptions)

  return computed(() => {
    const winrate = Array.from({ length: 4 }, () => [0, 0, 0, 0])
    const battles = Array.from({ length: 4 }, () => [0, 0, 0, 0])
    for (const line of result.value.data) {
      const t1 = bloggerGameIdToIndex[line.t1 as keyof typeof bloggerGameIdToIndex]
      const t2 = bloggerGameIdToIndex[line.t2 as keyof typeof bloggerGameIdToIndex]
      winrate[t1][t2] = line.winrate
      battles[t1][t2] = line.battlesPercent
    }
    return { winrate, battles }
  })
}

export function usePlayerDistribution() {
  const data = queryAsync<{ bloggerId: number, p: number }>(`
    with
        players as (
            select bloggerId,
                  countMerge(battles) as battles,
                  countMerge(wins) / battles as winrate
            from BOB25.Players
            group by playerBdid, bloggerId
            having battles > 100
        )
    select bloggerId,
          round(winrate * 100) as w,
          count() as c,
          count() / sum(count()) over (partition by bloggerId) as p
    from players
    group by bloggerId, w
    order by bloggerId, w
    with fill from 0 to 101 step 1;
  `, queryOptions)

  return computed(() => {
    if (data.value.status != success) return { status: data.value.status as Status, data: undefined }
    const byBlogger = Object.groupBy(data.value.data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { p: number }[]>

    const result = bloggerRecordToArray(byBlogger)
      .map(tanks => tanks?.map(t => t.p))

    return { status: data.value.status as Status, data: result }
  })
}
