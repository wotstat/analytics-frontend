import { CACHE_SETTINGS, loading, query, queryAsync, Status, success, SUPER_SHORT_CACHE_SETTINGS } from "@/db";
import { computed, onMounted, onUnmounted, Ref, shallowRef, watch, watchEffect } from "vue";
import { bloggerGameIdArrayToArray, bloggerGameIdToName, bloggerNameByGameId, bloggerNamesArray, bloggerRecordToArray, bloggerTimeSeriesProcess } from "./bloggerNames";
import { objectEntries, useDebounceFn, useIntervalFn, useLocalStorage } from "@vueuse/core";
import { getLast24HourBorders, getLastHourBorders, getTodayBorders, getYesterdayBorders } from "./timeUtils";

export const periodVariants = [
  { value: 'all', label: 'Всё время' },
  { value: 'today', label: 'Сегодня' },
  { value: 'yesterday', label: 'Вчера' },
  { value: 'lastHour', label: 'Прошлый час' },
  { value: 'last24', label: 'Прошлые 24ч' },
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

const periodToInterval = {
  'all': () => [1738875600, 1739736000],
  'today': () => getTodayBorders(),
  'yesterday': () => getYesterdayBorders(),
  'lastHour': () => getLastHourBorders(stepToInterval[step.value]),
  'last24': () => getLast24HourBorders(stepToInterval[step.value]),
}


export const period = useLocalStorage<typeof periodVariants[number]['value']>('bob25-selected-chart-period', 'today')
export const step = useLocalStorage<typeof stepVariants[number]['value']>('bob25-selected-chart-step', 'min10')

export function useTotalPlayers() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ bloggerId: number, count: number }>(`
      select bloggerId, argMax(count, dateTime) as count
      from BOB25.TotalPlayers
      group by bloggerId
    `, { allowCache: false })

    const byBlogger = Object.groupBy(data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { count: number }[]>
    const result = bloggerRecordToArray(byBlogger).flat().map(t => t?.count ?? 0)

    total.value = result
  }

  useIntervalFn(() => update(), 5000, { immediateCallback: true })

  return total
}

export function useTotalWinrate() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ bloggerId: number, winrate: number }>(`
      select bloggerId, countMerge(wins) / countMerge(battles) as winrate
      from BOB25.Battles
      group by bloggerId
    `, { allowCache: false, settings: CACHE_SETTINGS })

    const byBlogger = Object.groupBy(data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { winrate: number }[]>
    const result = bloggerRecordToArray(byBlogger).flat().map(t => t?.winrate ?? 0)

    total.value = result
  }

  useIntervalFn(() => update(), 60000, { immediateCallback: true })

  return total
}

export function useBloggerChart(q: (from: number, to: number, step: number) => string, visible: Ref<boolean>) {
  const target = shallowRef<{
    data: number[][],
    labels: number[],
  }>({
    data: [[], [], [], []],
    labels: [],
  })

  function reset() {
    target.value = {
      data: [[], [], [], []],
      labels: [],
    }
  }

  let raceId = 0
  async function update() {
    const from = periodToInterval[period.value]()[0]
    const to = periodToInterval[period.value]()[1]

    const currentRaceId = ++raceId
    const { data } = await query<{ bloggerId: number, value: number, t: number }>(q(from, to, stepToInterval[step.value]), { allowCache: false, settings: SUPER_SHORT_CACHE_SETTINGS })

    if (currentRaceId != raceId) return

    target.value = bloggerTimeSeriesProcess(data, {
      from: from,
      to: to,
      step: stepToInterval[step.value],
    })
  }

  const t = useIntervalFn(() => update(), () => Math.min(30000, stepToInterval[step.value] * 1000), { immediateCallback: true, immediate: false })
  t.pause()

  const updateDebounce = useDebounceFn(update, 100)

  watch(visible, v => {
    if (v) t.resume()
    else t.pause()
  }, { immediate: true })

  watch([period, step], () => {
    reset()
    updateDebounce()
  })

  return target
}

export function useTotalPlayersChart(visible: Ref<boolean>) {
  return useBloggerChart((from, to, step) => `
      select
        bloggerId,
        toUnixTimestamp(toStartOfInterval(dateTime, interval ${step} second)) as t,
        toUInt32(max(count)) as value
      from BOB25.TotalPlayers
      where dateTime between ${from} and ${to + step}
      group by t, bloggerId
      order by bloggerId, t
    `, visible)
}

export function useTotalScore() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ b1: number, b2: number, b3: number, b4: number }>(`
      select
        dateTime,
        quantileMerge(0.99)(b1Score) as b1,
        quantileMerge(0.99)(b2Score) as b2,
        quantileMerge(0.99)(b3Score) as b3,
        quantileMerge(0.99)(b4Score) as b4
      from BOB25.Scores
      where dateTime = (select max(dateTime) from BOB25.Scores)
      group by dateTime;
    `, { allowCache: false })

    total.value = (data.length ? bloggerGameIdArrayToArray([data[0].b1, data[0].b2, data[0].b3, data[0].b4]) : [0, 0, 0, 0]).map(v => v ?? 0)
  }

  useIntervalFn(() => update(), 10000, { immediateCallback: true })

  return total
}

export function useTotalScoreChart(visible: Ref<boolean>) {
  return useBloggerChart((from, to, step) => `
      with
          prepare as (
              with
                  quantileMerge(0.99)(b1Score) as b1,
                  quantileMerge(0.99)(b2Score) as b2,
                  quantileMerge(0.99)(b3Score) as b3,
                  quantileMerge(0.99)(b4Score) as b4
              select dateTime, b1, b2, b3, b4
              from BOB25.Scores
              where dateTime between ${from} and ${to + step}
              group by dateTime
          )
      select
          bloggerId,
          toUnixTimestamp(toStartOfInterval(dateTime, interval ${step} second)) as t,
          toUInt32(max(score)) as value
      from prepare
      array join [b1, b2, b3, b4] as score, [1, 2, 3, 4] as bloggerId
      group by bloggerId, t;
  `, visible)
}

export function useHourTotalScoreDelta() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ b1: number, b2: number, b3: number, b4: number }>(`
      with
          (select max(dateTime) from BOB25.Scores) as currentDate,
          (select max(dateTime) from BOB25.Scores where dateTime < now() - interval 1 hour) as lastDate,
          current as (
              select quantileMerge(0.99)(b1Score) as b1, quantileMerge(0.99)(b2Score) as b2, quantileMerge(0.99)(b3Score) as b3, quantileMerge(0.99)(b4Score) as b4
              from BOB25.Scores
              where dateTime = currentDate
          ),
          last as (
              select quantileMerge(0.99)(b1Score) as b1, quantileMerge(0.99)(b2Score) as b2, quantileMerge(0.99)(b3Score) as b3, quantileMerge(0.99)(b4Score) as b4
              from BOB25.Scores
              where dateTime = lastDate
          )
      select
          current.b1 - last.b1 AS b1,
          current.b2 - last.b2 AS b2,
          current.b3 - last.b3 AS b3,
          current.b4 - last.b4 AS b4
      from current
      cross join last;
    `, { allowCache: false, settings: { ...SUPER_SHORT_CACHE_SETTINGS, query_cache_nondeterministic_function_handling: 'save' } })

    total.value = (data.length ? bloggerGameIdArrayToArray([data[0].b1, data[0].b2, data[0].b3, data[0].b4]) : [0, 0, 0, 0])
      .map(v => v ?? 0)
  }

  useIntervalFn(() => update(), 10000, { immediateCallback: true })

  return total
}

export function use24HourTotalScoreDelta() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ b1: number, b2: number, b3: number, b4: number }>(`
      with
          (select max(dateTime) from BOB25.Scores) as currentDate,
          (select max(dateTime) from BOB25.Scores where dateTime < now() - interval 24 hour) as lastDate,
          current as (
              select quantileMerge(0.99)(b1Score) as b1, quantileMerge(0.99)(b2Score) as b2, quantileMerge(0.99)(b3Score) as b3, quantileMerge(0.99)(b4Score) as b4
              from BOB25.Scores
              where dateTime = currentDate
          ),
          last as (
              select quantileMerge(0.99)(b1Score) as b1, quantileMerge(0.99)(b2Score) as b2, quantileMerge(0.99)(b3Score) as b3, quantileMerge(0.99)(b4Score) as b4
              from BOB25.Scores
              where dateTime = lastDate
          )
      select
          current.b1 - last.b1 AS b1,
          current.b2 - last.b2 AS b2,
          current.b3 - last.b3 AS b3,
          current.b4 - last.b4 AS b4
      from current
      cross join last;
    `, { allowCache: false, settings: { ...SUPER_SHORT_CACHE_SETTINGS, query_cache_nondeterministic_function_handling: 'save' } })

    total.value = (data.length ? bloggerGameIdArrayToArray([data[0].b1, data[0].b2, data[0].b3, data[0].b4]) : [0, 0, 0, 0])
      .map(v => v ?? 0)
  }

  useIntervalFn(() => update(), 10000, { immediateCallback: true })

  return total
}

export function useYesterdayTotalScoreDelta() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ b1: number, b2: number, b3: number, b4: number }>(`
      with
          (select max(dateTime) from BOB25.Scores where dateTime < toStartOfInterval(now(), interval 1 day) + interval 3 hour) as currentDate,
          (select max(dateTime) from BOB25.Scores where dateTime < toStartOfInterval(now(), interval 1 day) - interval 1 day + interval 3 hour) as lastDate,
          current as (
              select quantileMerge(0.99)(b1Score) as b1, quantileMerge(0.99)(b2Score) as b2, quantileMerge(0.99)(b3Score) as b3, quantileMerge(0.99)(b4Score) as b4
              from BOB25.Scores
              where dateTime = currentDate
          ),
          last as (
              select quantileMerge(0.99)(b1Score) as b1, quantileMerge(0.99)(b2Score) as b2, quantileMerge(0.99)(b3Score) as b3, quantileMerge(0.99)(b4Score) as b4
              from BOB25.Scores
              where dateTime = lastDate
          )
      select
          current.b1 - if(isNaN(last.b1), 0, last.b1) AS b1,
          current.b2 - if(isNaN(last.b2), 0, last.b2) AS b2,
          current.b3 - if(isNaN(last.b3), 0, last.b3) AS b3,
          current.b4 - if(isNaN(last.b4), 0, last.b4) AS b4
      from current
      cross join last;
    `, { allowCache: false, settings: { ...SUPER_SHORT_CACHE_SETTINGS, query_cache_nondeterministic_function_handling: 'save' } })

    total.value = (data.length ? bloggerGameIdArrayToArray([data[0].b1, data[0].b2, data[0].b3, data[0].b4]) : [0, 0, 0, 0])
      .map(v => v ?? 0)
  }

  useIntervalFn(() => update(), 10000, { immediateCallback: true })

  return total
}

export function useAvgBattleDuration() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ bloggerId: number, duration: number }>(`
      select
        bloggerId,
        toUInt32(avgMerge(duration)) as duration
      from BOB25.Battles
      group by bloggerId
    `, { allowCache: false })

    const byBlogger = Object.groupBy(data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { duration: number }[]>
    const result = bloggerRecordToArray(byBlogger).flat().map(t => t?.duration ?? 0)

    total.value = result
  }

  useIntervalFn(() => update(), 10000, { immediateCallback: true })

  return total
}

export function useAvgBattleDurationChart(visible: Ref<boolean>) {
  return useBloggerChart((from, to, step) => `
      select
        bloggerId,
        toUnixTimestamp(toStartOfInterval(dateTime, interval ${step} second)) as t,
        toUInt32(avgMerge(duration)) as value
      from BOB25.Battles
      where dateTime between ${from} and ${to + step}
      group by t, bloggerId
      having countMerge(battles) > 300
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
      having countMerge(battles) > 300
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
    limit 7 by bloggerId;
  `, { settings: CACHE_SETTINGS })

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
    limit 7 by bloggerId;
  `, { settings: CACHE_SETTINGS })

  return computed(() => {
    if (data.value.status != success) return { status: data.value.status as Status, data: undefined }
    const byBlogger = Object.groupBy(data.value.data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { tankTag: string, score: number }[]>

    const result = bloggerRecordToArray(byBlogger)
      .map(tanks => tanks?.map(t => ({ tag: t.tankTag, value: t.score })))

    return { status: data.value.status as Status, data: result }
  })
}