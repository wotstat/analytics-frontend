import { useQueryStorage } from '@/shared/ui/queryStorage/useQueryStorage'

export function useShotQueryStorage() {
  return useQueryStorage({ shot: { type: String, default: null } }, { history: 'push', debounce: 150 })
}
