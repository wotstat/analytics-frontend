import { computed } from 'vue'
import { arenas } from '@/shared/game/arenas/arenas'
import { getArenaName } from '@/shared/i18n/i18n'
import { GameVendor } from '@/shared/game/wot'

export type ArenaOption = {
  game: GameVendor
  tag: string
  name: string
  gameplays: string[]
}

// Список уникальных арен (game+tag) с набором доступных для них gameplay — прямо из arenas.ts, без своих запросов.
export function useArenaOptions() {
  const arenaList = computed(() => {
    const map = new Map<string, ArenaOption>()
    for (const arena of arenas.value) {
      const key = `${arena.game}:${arena.tag}`
      const existing = map.get(key)
      if (existing) existing.gameplays.push(arena.gameplay)
      else map.set(key, { game: arena.game, tag: arena.tag, name: getArenaName(arena.tag), gameplays: [arena.gameplay] })
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  })

  // Реальные значения battleGameplay, встречающиеся в БД — шире словаря gameplayTypes из wot.ts.
  const allGameplays = computed(() => [...new Set(arenas.value.map(a => a.gameplay))].sort())

  return { arenaList, allGameplays }
}
