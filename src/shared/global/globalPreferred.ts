import { useLocalStorage } from '@vueuse/core'

export const preferredGame = useLocalStorage<'mt' | 'wot' | 'any' | 'unknown'>('preferred-game-variant', 'unknown')