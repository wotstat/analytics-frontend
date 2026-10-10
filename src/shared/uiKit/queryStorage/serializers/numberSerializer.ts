import type { Serializer } from './types'

export const numberSerializer: Serializer<number> = {
  serialize: value => {
    if (!Number.isFinite(value)) throw new Error('Invalid number')
    return String(value)
  },

  deserialize: raw => {
    const value = Number(raw)
    if (!raw.trim() || !Number.isFinite(value)) throw new Error('Invalid number')
    return value
  }
}
