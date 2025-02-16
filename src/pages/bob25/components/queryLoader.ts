import { CACHE_SETTINGS, LONG_CACHE_SETTINGS, query, queryAsync, SHORT_CACHE_SETTINGS, Status, success, SUPER_SHORT_CACHE_SETTINGS } from "@/db";
import { computed, Ref, shallowRef, watch } from "vue";
import { bloggerGameIdArrayToArray, bloggerGameIdToIndex, bloggerNameByGameId, bloggerRecordToArray, bloggerTimeSeriesProcess } from "./bloggerNames";
import { useDebounceFn, useIntervalFn, useLocalStorage } from "@vueuse/core";
import { getLast24HourBorders, getLastHourBorders, getTodayBorders, getYesterdayBorders } from "./timeUtils";
import { crossTablePeriod } from "../store";

export const periodVariants = [
  { value: 'today', label: 'Сегодня' },
  { value: 'yesterday', label: 'Вчера' },
  { value: 'lastHour', label: 'Прошлый час' },
  { value: 'last24', label: 'Прошлые 24ч' },
  { value: 'all', label: 'Всё время' },
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
  'all': () => [START, 1739736000],
  'today': () => getTodayBorders(),
  'yesterday': () => getYesterdayBorders(),
  'lastHour': () => getLastHourBorders(stepToInterval[step.value]),
  'last24': () => getLast24HourBorders(stepToInterval[step.value]),
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


export const period = useLocalStorage<typeof periodVariants[number]['value']>('bob25-selected-chart-period', 'today')
export const step = useLocalStorage<typeof stepVariants[number]['value']>('bob25-selected-chart-step', 'min10')

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
      from: period.value == 'all' ? data[0].t : from,
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

export function useTotalPlayers() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ bloggerId: number, count: number }>(`
      select bloggerId, argMax(count, dateTime) as count
      from BOB25.TotalPlayers
      group by bloggerId
    `, { allowCache: false, settings: SHORT_CACHE_SETTINGS })

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

export function useTotalBattles() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ bloggerId: number, value: number }>(`
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
    `, { allowCache: false, settings: CACHE_SETTINGS })

    const byBlogger = Object.groupBy(data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { value: number }[]>
    const result = bloggerRecordToArray(byBlogger).flat().map(t => t?.value ?? 0)

    total.value = result
  }

  useIntervalFn(() => update(), 60000, { immediateCallback: true })

  return total
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
    const last3Min = Date.now() / 1000 - 5 * 60
    const lastIndex = data.value.labels.findLastIndex(t => t < last3Min)

    const labels = data.value.labels

    return {
      data: data.value.data.map(d => d.map((t, i) => {
        if (i > lastIndex) return null
        if (labels[i] > 1739469480 && labels[i] < 1739470860) return null
        return t
      })),
      labels: labels
    }
  })

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
        quantileMerge(0.5)(b1Score) as b1,
        quantileMerge(0.5)(b2Score) as b2,
        quantileMerge(0.5)(b3Score) as b3,
        quantileMerge(0.5)(b4Score) as b4
      from BOB25.Scores
      where dateTime = (select max(dateTime) from BOB25.Scores)
      group by dateTime;
    `, { allowCache: false, settings: SHORT_CACHE_SETTINGS })

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
          toUInt32(argMax(score, t)) as value
      from prepare
      array join [b1, b2, b3, b4] as score, [1, 2, 3, 4] as bloggerId
      group by bloggerId, t
      order by bloggerId, t
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
              select quantileMerge(0.5)(b1Score) as b1, quantileMerge(0.5)(b2Score) as b2, quantileMerge(0.5)(b3Score) as b3, quantileMerge(0.5)(b4Score) as b4
              from BOB25.Scores
              where dateTime = currentDate
          ),
          last as (
              select quantileMerge(0.5)(b1Score) as b1, quantileMerge(0.5)(b2Score) as b2, quantileMerge(0.5)(b3Score) as b3, quantileMerge(0.5)(b4Score) as b4
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
    `, { allowCache: false, settings: { ...SHORT_CACHE_SETTINGS, query_cache_nondeterministic_function_handling: 'save' } })

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
              select quantileMerge(0.5)(b1Score) as b1, quantileMerge(0.5)(b2Score) as b2, quantileMerge(0.5)(b3Score) as b3, quantileMerge(0.5)(b4Score) as b4
              from BOB25.Scores
              where dateTime = currentDate
          ),
          last as (
              select quantileMerge(0.5)(b1Score) as b1, quantileMerge(0.5)(b2Score) as b2, quantileMerge(0.5)(b3Score) as b3, quantileMerge(0.5)(b4Score) as b4
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
      (select max(dateTime) from BOB25.Scores where dateTime < toStartOfInterval(now(), interval 1 day) + interval 6 hour + interval 1 minute) as currentDate,
      (select max(dateTime) from BOB25.Scores where dateTime < toStartOfInterval(now(), interval 1 day) + interval 6 hour + interval 1 minute - interval 1 day) as lastDate,
      current as (
          select quantileMerge(0.5)(b1Score) as b1, quantileMerge(0.5)(b2Score) as b2, quantileMerge(0.5)(b3Score) as b3, quantileMerge(0.5)(b4Score) as b4
          from BOB25.Scores
          where dateTime = currentDate
      ),
      last as (
          select quantileMerge(0.5)(b1Score) as b1, quantileMerge(0.5)(b2Score) as b2, quantileMerge(0.5)(b3Score) as b3, quantileMerge(0.5)(b4Score) as b4
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

  useIntervalFn(() => update(), 20000, { immediateCallback: true })

  return total
}

export function useTodayTotalScoreDelta() {
  const total = shallowRef([0, 0, 0, 0])

  async function update() {
    const { data } = await query<{ b1: number, b2: number, b3: number, b4: number }>(`
    with
      (select max(dateTime) from BOB25.Scores where dateTime < now()) as currentDate,
      (select max(dateTime) from BOB25.Scores where dateTime < toStartOfInterval(now(), interval 1 day) + interval 6 hour + interval 1 minute) as lastDate,
      current as (
          select quantileMerge(0.5)(b1Score) as b1, quantileMerge(0.5)(b2Score) as b2, quantileMerge(0.5)(b3Score) as b3, quantileMerge(0.5)(b4Score) as b4
          from BOB25.Scores
          where dateTime = currentDate
      ),
      last as (
          select quantileMerge(0.5)(b1Score) as b1, quantileMerge(0.5)(b2Score) as b2, quantileMerge(0.5)(b3Score) as b3, quantileMerge(0.5)(b4Score) as b4
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

  useIntervalFn(() => update(), 20000, { immediateCallback: true })

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
    `, { allowCache: false, settings: CACHE_SETTINGS })

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
    limit 30 by bloggerId;
  `, { settings: CACHE_SETTINGS })

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
  `, { settings: CACHE_SETTINGS })

  return computed(() => {
    if (data.value.status != success) return { status: data.value.status as Status, data: undefined }
    const byBlogger = Object.groupBy(data.value.data, t => bloggerNameByGameId(t.bloggerId)) as Record<string, { tankTag: string, score: number }[]>

    const result = bloggerRecordToArray(byBlogger)
      .map(tanks => tanks?.map(t => ({ tag: t.tankTag, value: t.score })))

    return { status: data.value.status as Status, data: result }
  })
}

export function useSkillsHistory() {
  const total = shallowRef<{
    skill: string;
    start: number;
  }[][]>([[], [], [], []])

  async function update() {
    const { data } = await query<{ bloggerId: number, skill: string, start: string, end: string, startD: number, endD: number }>(`
      select *, toUnixTimestamp(start) as startD, toUnixTimestamp(end) as endD from BOB25.Skills order by bloggerId, start;
      `, { allowCache: false, settings: SHORT_CACHE_SETTINGS })

    const byBlogger = Object.groupBy(data,
      t => bloggerNameByGameId(t.bloggerId)) as Record<string, { skill: string, startD: number, endD: number }[]>

    const processed = Object.fromEntries(Object.entries(byBlogger).map(([name, data]) => {
      let skills = []
      let currentSkill = { skill: 'default', start: 0, end: 0 }

      for (let i = 0; i < data.length; i++) {
        const t = data[i];
        // TODO: await 1 hour, ddos break deltas
        if (t.startD - currentSkill.start < 60 * 40 || t.skill == 'default') continue;
        skills.push(currentSkill)
        if (currentSkill.end - currentSkill.start > 60 * 60 * 1.2)
          skills.push({ skill: currentSkill.skill, start: currentSkill.end - 60 * 60, end: currentSkill.end })

        currentSkill = { skill: t.skill, start: t.startD, end: t.endD }
      }
      skills.push(currentSkill)

      return [name, skills]
    }))

    const result = bloggerRecordToArray(processed)
      .map(blog => blog?.map(t => ({ skill: t.skill, start: t.start })))

    total.value = result
  }


  useIntervalFn(() => update(), 10000, { immediateCallback: true })

  return total
}

export function useCrossWinrate() {
  const resultMatrix = shallowRef<number[][]>(Array(4).fill(0).map(() => Array(4).fill(0)))
  let counter = 0

  async function update(interval: typeof crossTablePeriod.value) {
    const currentCounter = ++counter
    const matrix = Array(4).fill(0).map(() => Array(4).fill(0))
    resultMatrix.value = [...matrix]

    const { data } = await query<{ t1: number, t2: number, winrate: number }>(`
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
            and dateTime between ${periodToInterval[interval]()[0]} and ${periodToInterval[interval]()[1]}
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
            countIf(win) / count() as winrate
      from joined
      group by t1, t2
      order by t1, t2;
    `, { settings: LONG_CACHE_SETTINGS })

    if (currentCounter != counter) return

    for (const line of data) {
      const t1 = bloggerGameIdToIndex[line.t1 as any as keyof typeof bloggerGameIdToIndex]
      const t2 = bloggerGameIdToIndex[line.t2 as any as keyof typeof bloggerGameIdToIndex]
      matrix[t1][t2] = line.winrate
    }

    resultMatrix.value = matrix
  }

  watch(crossTablePeriod, () => update(crossTablePeriod.value), { immediate: true })

  return resultMatrix
}

export function useCrossBattleCount() {
  const resultMatrix = shallowRef<number[][]>(Array(4).fill(0).map(() => Array(4).fill(0)))
  let counter = 0

  async function update(interval: typeof crossTablePeriod.value) {
    const currentCounter = ++counter
    const matrix = Array(4).fill(0).map(() => Array(4).fill(0))
    resultMatrix.value = [...matrix]

    const { data } = await query<{ t1: number, t2: number, battlesPercent: number }>(`
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
            and dateTime between ${periodToInterval[interval]()[0]} and ${periodToInterval[interval]()[1]}
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
            count() / sum(count()) over (partition by t1) as battlesPercent
      from joined
      group by t1, t2
      order by t1, t2;
    `, { settings: LONG_CACHE_SETTINGS })

    if (currentCounter != counter) return

    for (const line of data) {
      const t1 = bloggerGameIdToIndex[line.t1 as any as keyof typeof bloggerGameIdToIndex]
      const t2 = bloggerGameIdToIndex[line.t2 as any as keyof typeof bloggerGameIdToIndex]
      matrix[t1][t2] = line.battlesPercent
    }

    resultMatrix.value = matrix
  }

  watch(crossTablePeriod, () => update(crossTablePeriod.value), { immediate: true })

  return resultMatrix
}