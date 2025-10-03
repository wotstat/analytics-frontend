
export type SelectedArena = { tag: string, team: number | null }

export function arenaToHash(arena: SelectedArena): string {
  return `${arena.tag}:${arena.team}`
}

export function hashToArena(hash: string): SelectedArena {
  const splitted = hash.split(':')
  const team = splitted[splitted.length - 1]
  const tag = splitted.slice(0, splitted.length - 1).join(':')
  return { tag, team: team === 'null' ? null : Number(team) }
}