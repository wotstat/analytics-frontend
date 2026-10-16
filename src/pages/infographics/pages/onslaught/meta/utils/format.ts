import i18n from '@/shared/game/domain/comp7/i18n.json'
import type { Division } from '@/shared/game/domain/comp7/utils'

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })

export function formatNumber(value: number | null | undefined) {
  if (value == null) return '—'
  return numberFormatter.format(value).replaceAll(',', '\u00a0')
}

export function formatPercent(value: number | null) {
  if (value == null) return '—'
  return percentFormatter.format(value).replaceAll(',', '\u00a0')
}

export function rankLabel(division: Division) {
  if (division === 'qual') return 'Квалификация'
  const [rank, letter] = division.split('_')
  const translations: Record<string, string> = i18n.ru
  return [translations[`rank:${rank}`], letter].filter(Boolean).join(' ')
}
