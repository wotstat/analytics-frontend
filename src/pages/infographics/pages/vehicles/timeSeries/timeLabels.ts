import type { LabelLevel, Options, TickSource, ValueGenerator } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import type { HistoryStep } from './historyStep'

export const DAY = 24 * 60 * 60
const WEEK = 7 * DAY
// Начало Unix-времени приходится на четверг; сдвиг привязывает недели к понедельнику по UTC.
const MONDAY_OFFSET = -3 * DAY

const months = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
]

// Календарные границы: длина месяца и года не равна фиксированному числу суток.
function calendarMonths(step: number): ValueGenerator {
  return startFrom => {
    const date = new Date(startFrom * 1000)
    const month = Math.floor((date.getUTCFullYear() * 12 + date.getUTCMonth()) / step) * step
    const timestamp = (index: number) => Date.UTC(Math.floor(index / 12), index % 12, 1) / 1000

    const generate = function* (start: number, direction: number) {
      for (let index = 0; index < 1000; index++) yield timestamp(start + index * step * direction)
    }

    return {
      forward: generate(timestamp(month) < startFrom ? month + step : month, 1),
      backward: generate(month, -1),
    }
  }
}

export function isoWeekNumber(monday: number): number {
  const isoYear = new Date((monday + 3 * DAY) * 1000).getUTCFullYear()
  const januaryFourth = Date.UTC(isoYear, 0, 4) / 1000
  const dayOfWeek = (new Date(januaryFourth * 1000).getUTCDay() + 6) % 7
  const firstMonday = januaryFourth - dayOfWeek * DAY
  return Math.floor((monday - firstMonday) / WEEK) + 1
}

export function timeLabels(step: HistoryStep): Options {
  const dayTicks: TickSource = { source: { step: DAY }, minPixelSpacing: 6, classes: 'day-ticks' }
  const weekSource = { step: WEEK, offset: MONDAY_OFFSET }
  const weekTicks: TickSource = { source: weekSource, minPixelSpacing: 8, classes: 'week-ticks' }
  const monthTicks: TickSource = { source: calendarMonths(1), minPixelSpacing: 10, classes: 'month-ticks' }
  const yearTicks: TickSource = { source: calendarMonths(12), minPixelSpacing: 16, classes: 'year-ticks' }

  const year: LabelLevel = {
    source: calendarMonths(12),
    labelForValue: value => `${new Date(value * 1000).getUTCFullYear()}`,
    classes: 'year-labels',
    ticks: { source: 'labels', classes: 'year-ticks' },
  }

  const month: LabelLevel = {
    source: calendarMonths(1),
    labelForValue: value => months[new Date(value * 1000).getUTCMonth()],
    classes: 'month-labels',
    ticks: { source: 'labels', classes: 'month-ticks' },
  }

  const day: LabelLevel = {
    source: { step: DAY },
    labelForValue: value => `${new Date(value * 1000).getUTCDate()}`,
    strategy: { type: 'interval', placement: 'start', fit: true, offset: 4 },
    classes: 'day-labels',
    ticks: { source: 'labels', classes: 'day-ticks' },
  }

  const week: LabelLevel = {
    source: weekSource,
    labelForValue: value => `нед. ${isoWeekNumber(value)}`,
    strategy: { type: 'interval', placement: 'start', fit: true, offset: 4 },
    classes: 'week-labels',
    ticks: { source: 'labels', classes: 'week-ticks' },
  }

  const smallerTicks: TickSource[] = []
  if (step === 'day') smallerTicks.push(dayTicks)
  else if (step === 'week') smallerTicks.push(weekTicks)

  const monthWithSubticks: LabelLevel = {
    ...month,
    ticks: [{ source: 'labels', classes: 'month-ticks' }, ...smallerTicks],
  }

  const yearWithSubticks: LabelLevel = {
    ...year,
    ticks: [{ source: 'labels', classes: 'year-ticks' }, monthTicks, ...smallerTicks],
  }

  const abbreviatedMonth: LabelLevel = {
    ...monthWithSubticks,
    labelForValue: value => months[new Date(value * 1000).getUTCMonth()].slice(0, 3),
  }

  const denseCandidates: LabelLevel[][] = []
  if (step === 'month') {
    denseCandidates.push([month, year])
  } else {
    const period = step === 'day' ? day : week
    denseCandidates.push([period, month, year], [monthWithSubticks, year])
  }
  denseCandidates.push([abbreviatedMonth, year])

  const multiYearCandidates = [2, 5, 10].map(yearStep => [{
    ...year,
    source: calendarMonths(12 * yearStep),
    ticks: [{ source: 'labels', classes: 'year-ticks' }, yearTicks, monthTicks, ...smallerTicks],
  } satisfies LabelLevel])

  return {
    values: [
      ...denseCandidates,
      [yearWithSubticks],
      ...multiYearCandidates,
    ],
    keyForValue: value => `${value}`,
    strategy: { type: 'interval', placement: 'start', fit: true, offset: 4 },
    padding: 8,
    labelOffset: 7,
    levelGap: 4,
    slotSize: 'max-candidate',
  }
}
