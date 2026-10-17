import { nations, type Nation } from '../../domain/vehicles/nations'
import { unpackRegionalId } from './regionalIdPacking'

// Постоянные префиксы наций. Новая нация требует явного префикса.
const nationPrefixes = {
  ussr: 'R',
  germany: 'G',
  usa: 'A',
  china: 'Ch',
  france: 'F',
  uk: 'GB',
  japan: 'J',
  czech: 'Cz',
  sweden: 'S',
  poland: 'Pl',
  italy: 'It',
  intunion: 'Un',
} satisfies Record<Nation, string>

if (nations.length > 16) throw new Error('Compact vehicle nation ID range exhausted')

export function vehicleId(tag: string): number | undefined {
  const match = /^([^:]+):([A-Za-z]+)(\d+)_/.exec(tag)
  if (!match) return

  const nation = nations.indexOf(match[1] as Nation)
  if (nation < 0 || nationPrefixes[nations[nation]] !== match[2]) return

  const number = Number(match[3])
  if (!Number.isSafeInteger(number) || number > 0xffffff) return
  return number * 16 + nation
}

export function vehicleCompactLabel(value: number | string): string {
  if (typeof value === 'string') return value
  const packed = unpackRegionalId(value)
  if (!packed) return String(value)
  const nation = nations[packed.id % 16]
  if (nation === undefined) return String(value)
  return `${packed.region ? packed.region + ':' : ''}${nationPrefixes[nation]}${Math.floor(packed.id / 16)}`
}

export function arenaId(tag: string): number | undefined {
  const match = /^(\d+)_/.exec(tag)
  if (!match) return
  const id = Number(match[1])
  return Number.isSafeInteger(id) ? id : undefined
}
