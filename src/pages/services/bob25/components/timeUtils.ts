

const HOUR = 3600
export function getTodayBorders(): [number, number] {
  const now = Date.now()
  const date = new Date(now)
  date.setUTCHours(0, 0, 0, 0)
  const start = Math.floor(date.getTime() / 1000) - 3 * HOUR
  const end = start + 24 * HOUR
  return [start + 9 * HOUR, end + HOUR * 2]
}

export function getYesterdayBorders(): [number, number] {
  const now = Date.now()
  const date = new Date(now)
  date.setUTCHours(0, 0, 0, 0)
  const start = Math.floor(date.getTime() / 1000) - 3 * HOUR
  const end = start + 24 * HOUR
  return [start + 9 * HOUR - 24 * HOUR, end + HOUR - 24 * HOUR + HOUR]
}

export function getLastHourBorders(interval: number): [number, number] {
  const nowInSeconds = Math.floor(Date.now() / 1000)

  const start = nowInSeconds - nowInSeconds % interval
  return [start - HOUR, start]
}

export function getLast24HourBorders(interval: number): [number, number] {
  const nowInSeconds = Math.floor(Date.now() / 1000)

  const start = nowInSeconds - nowInSeconds % interval
  return [start - 24 * HOUR, start]
}