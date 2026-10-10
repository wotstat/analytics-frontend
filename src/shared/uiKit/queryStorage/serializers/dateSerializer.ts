import type { Serializer } from './types'

const precisionMilliseconds = {
  day: 86_400_000,
  hour: 3_600_000,
  minute: 60_000,
  second: 1_000,
  millisecond: 1
}

export type DatePrecision = keyof typeof precisionMilliseconds

export function dateSerializer(precision: DatePrecision = 'second'): Serializer<Date> {
  const step = precisionMilliseconds[precision]

  function round(value: Date) {
    const time = value.getTime()
    if (!Number.isFinite(time)) throw new Error('Invalid date')
    return new Date(Math.round(time / step) * step)
  }

  return {
    serialize: value => round(value).toISOString()
      .replace(/\.?0*Z$/, '')
      .replace(/:00$/, '')
      .replace(/T00:00$/, ''),

    deserialize: raw => {
      const normalized = raw.replace(/(T\d{2})(Z|[+-]\d{2}:?\d{2})?$/i, '$1:00$2')
      // Compact ISO strings omit the timezone but still represent UTC.
      if (/T[\d:.]+$/i.test(normalized)) return round(new Date(`${normalized}Z`))
      return round(new Date(normalized))
    }
  }
}
