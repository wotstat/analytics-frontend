import { defineParams, useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { nicknameParam } from '@/shared/legacyStatQuery/statQueryParams'
import { regionQueryParam, useSingleRegion } from '@/shared/game/domain/region/regionQueryParam'

export { regions, type OnslaughtRegion } from './regions'

const params = defineParams({
  regions: regionQueryParam,
  season: { type: String, default: null }
})

export function useOnslaughtQueryStorage() {
  const storage = useQueryStorage(params, { history: 'push' })
  return { ...storage, params: { ...storage.params, region: useSingleRegion(storage.params.regions) } }
}

export function useOnslaughtNicknameStorage() {
  return useQueryStorage({ nickname: nicknameParam }, { history: 'push', debounce: 1000 })
}
