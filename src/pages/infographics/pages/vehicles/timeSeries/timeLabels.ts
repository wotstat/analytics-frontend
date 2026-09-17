import type { LabelLevelOptions, Options, TickSource, ValueGenerator } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'

export const DAY = 24 * 60 * 60

const months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']

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

export function timeLabels(): Options {
  const dayTicks: TickSource = { source: { step: DAY }, minPixelSpacing: 6, classes: 'day-ticks' }
  const monthTicks: TickSource = { source: calendarMonths(1), minPixelSpacing: 10, classes: 'month-ticks' }
  const yearTicks: TickSource = { source: calendarMonths(12), minPixelSpacing: 16, classes: 'year-ticks' }
  const year: LabelLevelOptions = {
    source: calendarMonths(12),
    labelForValue: value => `${new Date(value * 1000).getUTCFullYear()}`,
    classes: 'year-labels',
    ticks: { source: 'labels', classes: 'year-ticks' },
  }
  const month: LabelLevelOptions = {
    source: calendarMonths(1),
    labelForValue: value => months[new Date(value * 1000).getUTCMonth()],
    classes: 'month-labels',
    ticks: { source: 'labels', classes: 'month-ticks' },
  }
  const day: LabelLevelOptions = {
    source: { step: DAY },
    labelForValue: value => `${new Date(value * 1000).getUTCDate()}`,
    strategy: { type: 'interval', placement: 'start', fit: true, offset: 4 },
    classes: 'day-labels',
    ticks: { source: 'labels', classes: 'day-ticks' },
  }
  const monthWithSubticks: LabelLevelOptions = {
    ...month,
    ticks: [{ source: 'labels', classes: 'month-ticks' }, dayTicks],
  }
  const yearWithSubticks: LabelLevelOptions = {
    ...year,
    ticks: [{ source: 'labels', classes: 'year-ticks' }, monthTicks, dayTicks],
  }

  return {
    // Этажи идут от ближайшего к оси к дальнему. Движок выбирает первый
    // массив, в котором помещаются все подписи, при каждом изменении зума.
    values: [
      [day, month, year],
      [monthWithSubticks, year],
      [{ ...monthWithSubticks, labelForValue: value => months[new Date(value * 1000).getUTCMonth()].slice(0, 3) }, year],
      [yearWithSubticks],
      ...[2, 5, 10].map(step => [{
        ...year,
        source: calendarMonths(12 * step),
        ticks: [{ source: 'labels', classes: 'year-ticks' }, yearTicks, monthTicks, dayTicks],
      } satisfies LabelLevelOptions]),
    ],
    keyForValue: value => `${value}`,
    strategy: { type: 'interval', placement: 'start', fit: true, offset: 4 },
    padding: 8,
    labelOffset: 7,
    levelGap: 4,
    slotSize: 'max-candidate',
  }
}
