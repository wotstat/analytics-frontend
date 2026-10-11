import { Reader, Writer, invalid } from '@/shared/utils/encoding/compactBinary'
import { encodeBase62, decodeBase62 } from '@/shared/utils/encoding/base62'
import { deflate, inflate } from '@/shared/utils/encoding/deflate'
import type { VehicleFilters } from '../../../filters/types'
import { unrestrictedComparisonFilters, type SavedComparisonSource } from '../state'
import { writeFilterTable, readFilterTable } from './filters'
import { writeSources, readSources } from './sources'
import { binaryLimits, MAX_SOURCES } from './limits'

const FORMAT_VERSION = 1
const VERSION_SHIFT = 6
const FILTERS_FLAG = 2
const DEFLATE_FLAG = 32

// Заголовок вне DEFLATE: [VV Z M D2 D1 F D3]. Версия 11 зарезервирована под следующий varint.
function encode(flags: number, payload: Uint8Array): string {
  const compressed = deflate(payload)
  if (compressed.length < payload.length) {
    flags |= DEFLATE_FLAG
    payload = compressed
  }
  const output = new Writer({ maxBytes: binaryLimits.maxBytes + 1 })
  output.byte(FORMAT_VERSION << VERSION_SHIFT | flags)
  output.raw(payload)
  return encodeBase62(output.finish())
}

export function serializeComparison(sources: readonly SavedComparisonSource[], context?: VehicleFilters): string {
  if (sources.length > MAX_SOURCES) return invalid()
  const output = new Writer(binaryLimits)
  const base = context ?? unrestrictedComparisonFilters()
  const filters = writeFilterTable(output, sources.map(source => source.filters), base)
  const flags = (filters.present ? FILTERS_FLAG : 0) | writeSources(output, sources, filters.references)
  return encode(flags, output.finish())
}

export function deserializeComparison(raw: string, context?: VehicleFilters): SavedComparisonSource[] {
  const bytes = decodeBase62(raw, binaryLimits.maxBytes + 1)
  const header = bytes[0]
  // Поддерживается только текущая версия; неизвестные, включая расширенные, отвергаются.
  if (header === undefined || header >> VERSION_SHIFT !== FORMAT_VERSION) return invalid()
  const flags = header & 63
  const payload = bytes.subarray(1)
  const input = new Reader(flags & DEFLATE_FLAG ? inflate(payload, binaryLimits.maxBytes) : payload, binaryLimits)

  const base = context ?? unrestrictedComparisonFilters()
  const filters = flags & FILTERS_FLAG ? readFilterTable(input, base) : [base]
  return readSources(input, filters, flags)
}
