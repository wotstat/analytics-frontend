import { useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'

export function useShotQueryStorage() {
  return useQueryStorage({ shot: { type: String, default: null } }, { history: 'push', debounce: 150 })
}
