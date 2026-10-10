import { battleModeQueryParam } from '@/shared/game/domain/battleModes/battleModeQueryParam'
import { defineParams, useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { dateSerializer } from '@/shared/uiKit/queryStorage/serializers/dateSerializer'
import type { TankLevel, TankType } from './useQueryStatParams'

export const nicknameParam = { type: String, default: '' }

export const stringListParam = {
  default: (): string[] => [],
  serialize: (values: string[]) => values.join(','),
  deserialize: (raw: string) => raw.split(',').filter(Boolean)
}

export const dateParam = {
  ...dateSerializer(),
  default: undefined
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
  battleModes: battleModeQueryParam,
  battleId: { ...stringListParam, label: 'battle-id' },
  lastX: {
    default: undefined,
    deserialize: (raw: string) => {
      const count = Number(raw)
      if (!Number.isSafeInteger(count) || count < 1) throw new Error('Invalid battle count')
      return count
    }
  },
  from: dateParam,
  to: dateParam
})

export function useStatQueryStorage() {
  return useQueryStorage(statQueryParams, { history: 'push' })
}
