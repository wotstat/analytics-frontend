import { Reader, invalid } from '@/shared/utils/encoding/compactBinary'
import { decodeBase62 } from '@/shared/utils/encoding/base62'
import { inflate } from '@/shared/utils/encoding/deflate'
import type { VehicleFilters } from '../../../filters/types'
import { unrestrictedComparisonFilters, type SavedComparisonSource } from '../state'
import { readFilterTable } from './utils/filters'
import { readSources } from './utils/sources'
import { binaryLimits } from './utils/limits'

export const comparisonFormat = { version: 1, versionShift: 6, filtersFlag: 2, deflateFlag: 32 } as const

export function deserializeComparison(raw: string, context?: VehicleFilters): SavedComparisonSource[] {
  const bytes = decodeBase62(raw, binaryLimits.maxBytes + 1)
  const header = bytes[0]
  // Поддерживается только текущая версия; неизвестные, включая расширенные, отвергаются.
  if (header === undefined || header >> comparisonFormat.versionShift !== comparisonFormat.version) return invalid()
  const flags = header & 63
  const payload = bytes.subarray(1)
  const input = new Reader(flags & comparisonFormat.deflateFlag ? inflate(payload, binaryLimits.maxBytes) : payload, binaryLimits)

  const base = context ?? unrestrictedComparisonFilters()
  const filters = flags & comparisonFormat.filtersFlag ? readFilterTable(input, base) : [base]
  return readSources(input, filters, flags)
}
