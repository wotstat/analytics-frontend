import type { GameRegion } from './wot'

export type HistoryEvent = Readonly<{
  id: string
  label: string
  color: string
  start: string
  // Без end событие мгновенное. Дата окончания без времени включается целиком.
  end?: string
  // Без regions событие отображается во всех регионах.
  regions?: readonly GameRegion[]
}>

export const historyEvents: readonly HistoryEvent[] = [
  {
    id: 'razvorot',
    label: 'Разворот 1.36.1',
    color: '#b8d9a6',
    start: '2025-08-07',
    end: '2025-09-02',
    regions: ['RU'],
  },
  {
    id: 'stun-removal',
    label: 'Отмена стана',
    color: '#a6d9d4',
    start: '2025-10-15',
    regions: ['RU'],
  },
  {
    id: 'bops-removal',
    label: 'Вывод БОПС',
    color: '#d1b3e6',
    start: '2026-08-27',
    regions: ['RU'],
  },
]

export function getHistoryEventRegions(event: HistoryEvent, selectedRegions: readonly GameRegion[]) {
  return event.regions?.filter(region => !selectedRegions.length || selectedRegions.includes(region))
}
