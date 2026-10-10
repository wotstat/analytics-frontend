import type { Serializer } from './types'

export const stringSerializer: Serializer<string> = {
  serialize: value => value,
  deserialize: raw => raw
}
