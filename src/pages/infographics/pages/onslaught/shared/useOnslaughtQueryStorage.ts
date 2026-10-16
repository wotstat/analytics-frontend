import { defineParams, useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { nicknameParam } from '@/shared/legacyStatQuery/statQueryParams'
import { regions, type OnslaughtRegion } from './regions'

export { regions, type OnslaughtRegion } from './regions'

const params = defineParams({
  region: {
    default: 'RU' as OnslaughtRegion,
    deserialize: (raw: string): OnslaughtRegion => {
      if ([...regions, 'CT'].includes(raw)) return raw as OnslaughtRegion
      throw new Error('Unknown region')
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
