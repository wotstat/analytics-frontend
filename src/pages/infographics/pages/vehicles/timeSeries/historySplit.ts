import { getArenaName } from '@/shared/i18n/i18n'

export type VehicleHistorySplit = 'arena' | 'platoon' | 'result' | 'battleLevel'

export const historySplitOptions = [
  { value: 'arena', label: 'Разбить по картам' },
  { value: 'platoon', label: 'Разбить по взводам' },
  { value: 'result', label: 'Разбить по результатам боя' },
  { value: 'battleLevel', label: 'Разбить по уровню боя' },
] as const satisfies readonly { value: VehicleHistorySplit, label: string }[]

const labels: Record<Exclude<VehicleHistorySplit, 'arena'>, Record<string, string>> = {
  platoon: {
    solo: 'Без взвода',
    duo: '2 игрока',
    trio: '3 игрока',
    large: '4 и более',
  },
  result: {
    win: 'Победа',
    loss: 'Поражение',
    draw: 'Ничья',
  },
  battleLevel: {
    same: 'Одноуровневый',
    top: 'В топе',
    middle: 'В середине',
    bottom: 'Внизу списка',
  },
}

const orders: Record<Exclude<VehicleHistorySplit, 'arena'>, readonly string[]> = {
  platoon: ['solo', 'duo', 'trio', 'large'],
  result: ['win', 'loss', 'draw'],
  battleLevel: ['same', 'top', 'middle', 'bottom'],
}

export function historySplitName(split: VehicleHistorySplit, key: string) {
  if (split === 'arena') return getArenaName(key)
  return labels[split][key] ?? key
}

export function orderHistorySplitKeys(split: VehicleHistorySplit, keys: readonly string[]) {
  if (split === 'arena') {
    return [...keys].sort((left, right) => historySplitName(split, left).localeCompare(historySplitName(split, right), 'ru'))
  }

  const order = orders[split]
  return [...keys].sort((left, right) => {
    const leftIndex = order.indexOf(left)
    const rightIndex = order.indexOf(right)
    if (leftIndex === -1 || rightIndex === -1) {
      if (leftIndex === rightIndex) return left.localeCompare(right)
      return leftIndex === -1 ? 1 : -1
    }
    return leftIndex - rightIndex
  })
}
