import { gameRegions } from '../../domain/regions'

// Бит 0: регион записан в ID. Биты 1..4: код региона. Остальные биты: ID сущности.
const HAS_REGION_FLAG = 1 << 0
const REGION_BITS = 4
const REGION_SHIFT = 1
const REGION_MASK = 2 ** REGION_BITS - 1
const ID_WITH_REGION_SHIFT = REGION_SHIFT + REGION_BITS

// Без encodedRegion регион наследуется из внешнего контекста при чтении.
export function packRegionalId(id: number, encodedRegion?: string): number | undefined {
  if (!Number.isSafeInteger(id) || id < 0) return

  if (encodedRegion === undefined) {
    const value = id * 2 ** REGION_SHIFT
    return Number.isSafeInteger(value) ? value : undefined
  }

  const index = gameRegions.indexOf(encodedRegion as typeof gameRegions[number])
  if (index < 0 || index > REGION_MASK) return

  const value = id * 2 ** ID_WITH_REGION_SHIFT + (index << REGION_SHIFT) + HAS_REGION_FLAG
  return Number.isSafeInteger(value) ? value : undefined
}

export function unpackRegionalId(value: number, contextRegion?: string): { id: number, region?: string } | undefined {
  if (!Number.isSafeInteger(value) || value < 0) return

  if (!(value & HAS_REGION_FLAG)) return { id: value / 2 ** REGION_SHIFT, region: contextRegion }

  const index = Math.floor(value / 2 ** REGION_SHIFT) & REGION_MASK
  if (gameRegions[index] === undefined) return
  // Деление сохраняет безопасные целые JS; сдвиг всего value обрезал бы старшие биты до 32 бит.
  return { id: Math.floor(value / 2 ** ID_WITH_REGION_SHIFT), region: gameRegions[index] }
}
