import { oneOfSerializer } from './oneOfSerializer'
import { setSerializer } from './setSerializer'
import type { Serializer } from './types'

export function setOfSerializer<const T extends string | number>(options: readonly T[]): Serializer<Set<T>> {
  return setSerializer(oneOfSerializer(options))
}
