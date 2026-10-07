import { customBattleModes } from '@/shared/game/wot'
import { defineParams, useQueryStorage } from '@/shared/ui/queryStorage/useQueryStorage'
import type { TankLevel, TankType } from './useQueryStatParams'

export const nicknameParam = { type: String, default: '' }

export const stringListParam = {
  default: (): string[] => [],
  serialize: (values: string[]) => values.join(','),
  deserialize: (raw: string) => raw.split(',').filter(Boolean)
}

export const dateParam = {
  default: undefined,
  serialize: (value: Date) => value.toISOString(),
  deserialize: (raw: string) => {
    const date = new Date(raw)
    if (!Number.isFinite(date.getTime())) throw new Error('Некорректная дата')
    return date
  }
}

export const statQueryParams = defineParams({
  nickname: nicknameParam,
  level: {
    default: (): TankLevel[] => [],
    serialize: (values: TankLevel[]) => values.join(','),
    deserialize: (raw: string): TankLevel[] => raw.split(',').map(Number)
      .filter(value => Number.isInteger(value) && value >= 1 && value <= 11) as TankLevel[]
  },
  types: {
    label: 'type',
    default: (): TankType[] => [],
    serialize: (values: TankType[]) => values.join(','),
    deserialize: (raw: string) => raw.split(',').filter((value): value is TankType => ['LT', 'MT', 'HT', 'AT', 'SPG'].includes(value))
  },
  tanks: { ...stringListParam, label: 'tank' },
  battleMode: {
    label: 'mode',
    default: 'normalAny' as keyof typeof customBattleModes | 'any',
    deserialize: (raw: string): keyof typeof customBattleModes | 'any' => {
      if (raw === 'any' || Object.hasOwn(customBattleModes, raw)) return raw as keyof typeof customBattleModes | 'any'
      throw new Error('Неизвестный режим боя')
    }
  },
  battleId: { ...stringListParam, label: 'battle-id' },
  lastX: {
    default: undefined,
    deserialize: (raw: string) => {
      const count = Number(raw)
      if (!Number.isSafeInteger(count) || count < 1) throw new Error('Некорректное число боёв')
      return count
    }
  },
  from: dateParam,
  to: dateParam
})

export function useStatQueryStorage() {
  return useQueryStorage(statQueryParams, { history: 'push' })
}
