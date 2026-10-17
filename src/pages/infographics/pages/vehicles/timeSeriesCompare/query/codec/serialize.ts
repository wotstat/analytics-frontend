import { Writer, invalid } from '@/shared/utils/encoding/compactBinary'
import { encodeBase62 } from '@/shared/utils/encoding/base62'
import { deflate } from '@/shared/utils/encoding/deflate'
import { vehicleCompactor } from '@/shared/game/encoding/vehicles'
import { arenaCompactor } from '@/shared/game/encoding/arenas'
import type { VehicleFilters } from '../../../filters/types'
import { unrestrictedComparisonFilters, type SavedComparisonSource } from '../state'
import { comparisonFormat } from './codec'
import { writeFilterTable } from './utils/filters'
import { writeSources } from './utils/sources'
import { binaryLimits, MAX_SOURCES } from './utils/limits'

// Заголовок вне DEFLATE: [VV Z M D2 D1 F D3]. Версия 11 зарезервирована под следующий varint.
function encode(flags: number, payload: Uint8Array): string {
  const compressed = deflate(payload)
  if (compressed.length < payload.length) {
    flags |= comparisonFormat.deflateFlag
    payload = compressed
  }

  const output = new Writer({ maxBytes: binaryLimits.maxBytes + 1 })
  output.byte(comparisonFormat.version << comparisonFormat.versionShift | flags)
  output.raw(payload)
  return encodeBase62(output.finish())
}

export function serializeComparison(sources: readonly SavedComparisonSource[], context?: VehicleFilters): string {
  if (sources.length > MAX_SOURCES) return invalid()
  const output = new Writer(binaryLimits)
  const base = context ?? unrestrictedComparisonFilters()
  const filters = writeFilterTable(output, sources.map(source => source.filters), base, arenaCompactor)
  const flags = (filters.present ? comparisonFormat.filtersFlag : 0) | writeSources(output, sources, filters.references, vehicleCompactor)
  return encode(flags, output.finish())
}
