import { useLocalStorage } from '@vueuse/core'
import { GameVendor } from '../game/wot'
import { computed } from 'vue'

export const preferredGame = useLocalStorage<GameVendor | 'any' | 'unknown'>('preferred-game-variant', 'unknown')
export const preferredGameOrDefault = computed<GameVendor>({
  get() {
    return preferredGame.value === 'unknown' || preferredGame.value === 'any' ? 'mt' : preferredGame.value
  },
  set(value) {
    preferredGame.value = value
  }
})