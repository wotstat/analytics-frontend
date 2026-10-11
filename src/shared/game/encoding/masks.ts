import { compactMask, expandMask } from '@/shared/utils/encoding/compactBinary'
import { vehicleLevels, vehicleTypes } from '../domain/vehicles/types'
import { nations } from '../domain/vehicles/nations'

export const nationMask = {
  compact: (values: readonly string[]) => compactMask(values, nations),
  expand: (bits: number) => expandMask(bits, nations),
}

export const vehicleLevelMask = {
  compact: (levels: readonly number[]) => compactMask(levels, vehicleLevels),
  expand: (bits: number) => expandMask(bits, vehicleLevels),
}

export const vehicleTypeMask = {
  compact: (types: readonly string[]) => compactMask(types, vehicleTypes),
  expand: (bits: number) => expandMask(bits, vehicleTypes),
}
