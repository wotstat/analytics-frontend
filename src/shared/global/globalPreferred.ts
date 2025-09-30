import { useLocalStorage } from '@vueuse/core'
import { GameVendor } from '../game/wot'

export const preferredGame = useLocalStorage<GameVendor | 'any' | 'unknown'>('preferred-game-variant', 'unknown')