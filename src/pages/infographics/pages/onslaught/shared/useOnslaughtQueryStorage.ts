import { defineParams, useQueryStorage } from '@/shared/ui/queryStorage/useQueryStorage'
import { nicknameParam } from '@/shared/query/statQueryParams'

export const regions = ['RU', 'EU', 'NA', 'ASIA', 'CN'] as const
export type OnslaughtRegion = typeof regions[number] | 'CT'

const params = defineParams({
  region: {
    default: 'RU' as OnslaughtRegion,
    deserialize: (raw: string): OnslaughtRegion => {
      if ([...regions, 'CT'].includes(raw)) return raw as OnslaughtRegion
      throw new Error('Неизвестный регион')
    }
  },
  season: { type: String, default: null }
})

export function useOnslaughtQueryStorage() {
  return useQueryStorage(params, { history: 'push' })
}

export function useOnslaughtNicknameStorage() {
  return useQueryStorage({ nickname: nicknameParam }, { history: 'push', debounce: 1000 })
}
