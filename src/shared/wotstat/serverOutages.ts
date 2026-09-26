export type ServerOutage = Readonly<{
  start: string
  end: string
  info?: string
}>

type ServerOutageDataset = Readonly<{
  timeZone: 'UTC'
  minimumGapMinutes: number
  mergeGapMinutes: number
  boundaryMeaning: string
  intervals: readonly ServerOutage[]
}>

export const serverOutages = {
  timeZone: 'UTC',
  minimumGapMinutes: 60,
  mergeGapMinutes: 60,
  boundaryMeaning: 'start/end — внешние границы группы пауз; внутри возможны краткие возобновления поступления событий',
  intervals: [
    {
      start: '2024-11-04T12:12:21.331Z',
      end: '2024-11-04T14:07:02.034Z',
    },
    {
      start: '2024-11-27T03:29:54.811Z',
      end: '2024-11-27T04:59:28.317Z',
    },
    {
      start: '2025-01-29T17:31:31.364Z',
      end: '2025-02-02T15:46:05.238Z',
      info: 'Сломался жесткий диск на сервере. Замена и восстановление заняли время.',
    },
    {
      start: '2025-05-10T06:05:38.788Z',
      end: '2025-05-10T18:27:01.047Z',
    },
    {
      start: '2025-12-31T02:59:46.364Z',
      end: '2026-01-01T00:11:30.769Z',
    },
    {
      start: '2026-01-01T19:03:24.283Z',
      end: '2026-01-01T20:33:11.333Z',
    },
    {
      start: '2026-01-16T16:16:29.265Z',
      end: '2026-01-16T21:07:41.710Z',
    },
    {
      start: '2026-01-19T12:34:25.371Z',
      end: '2026-01-20T12:24:17.787Z',
      info: 'Проблемы с сетью на стороне Hetzner. Было заблокирована подсеть Aeza.',
    },
    {
      start: '2026-04-28T12:14:46.429Z',
      end: '2026-04-30T17:28:14.807Z',
      info: 'Проблемы с сетью на стороне Hetzner. Сервер работал, но выхода в интернет не было.',
    },
    {
      start: '2026-06-10T06:05:43.456Z',
      end: '2026-06-10T12:38:02.342Z',
    },
    {
      start: '2026-07-28T06:27:33.213Z',
      end: '2026-07-28T12:39:44.003Z',
    },
  ],
} as const satisfies ServerOutageDataset

const DAY_MS = 24 * 60 * 60 * 1000
const durationByUtcDay = new Map<string, number>()

for (const { start, end } of serverOutages.intervals) {
  const startMs = Date.parse(start)
  const endMs = Date.parse(end)

  for (let dayStart = Math.floor(startMs / DAY_MS) * DAY_MS; dayStart < endMs; dayStart += DAY_MS) {
    const day = new Date(dayStart).toISOString().slice(0, 10)
    const duration = Math.min(endMs, dayStart + DAY_MS) - Math.max(startMs, dayStart)
    durationByUtcDay.set(day, (durationByUtcDay.get(day) ?? 0) + duration)
  }
}

/** Суммарная длительность пересечения интервалов недоступности с UTC-днём. */
export function getServerOutageDurationMs(day: string): number {
  return durationByUtcDay.get(day) ?? 0
}

/** Суммарная недоступность за UTC-день строго больше порога. */
export function hasServerOutageOver(day: string, thresholdMs: number): boolean {
  return getServerOutageDurationMs(day) > thresholdMs
}
