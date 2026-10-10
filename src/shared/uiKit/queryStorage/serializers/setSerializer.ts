import { arraySerializer } from './arraySerializer'
import type { Serializer, ValueValidator } from './types'

export function setSerializer<T>(item: Serializer<T>, validate?: ValueValidator<T>): Serializer<Set<T>> {
  const array = arraySerializer(item, validate)
  return {
    serialize: values => array.serialize([...values]),
    deserialize: raw => new Set(array.deserialize(raw))
  }
}
