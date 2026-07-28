// Форматы подписей: от коротких чисел до заведомо неподъёмного текста.

export const labelFormats = [
  { value: 'plain', label: 'Как есть' },
  { value: 'grouped', label: 'С разрядами' },
  { value: 'compact', label: 'Компактно' },
  { value: 'fixed', label: 'Два знака' },
  { value: 'date', label: 'Дата' },
  { value: 'long', label: 'Длинный текст' },
  { value: 'mixed', label: 'Скачущая ширина' },
] as const

export type LabelFormat = typeof labelFormats[number]['value']

const grouped = new Intl.NumberFormat('ru-RU')
const compact = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 })
const date = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

const DAY_MS = 24 * 60 * 60 * 1000
const DATE_START = Date.UTC(2026, 0, 1)

export function formatLabel(kind: LabelFormat, value: number): string {
  switch (kind) {
    case 'plain': return `${value}`
    case 'grouped': return grouped.format(value)
    case 'compact': return compact.format(value)
    case 'fixed': return value.toFixed(2)
    case 'date': return date.format(new Date(DATE_START + value * DAY_MS))
    case 'long': return `значение № ${value} за отчётный период`
    case 'mixed': return value % 3 === 0 ? `${value} — длинная подпись` : `${value}`
  }
}
