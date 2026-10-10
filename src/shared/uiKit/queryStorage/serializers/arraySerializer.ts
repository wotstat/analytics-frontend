import type { Serializer, ValueValidator } from './types'

export function arraySerializer<T>(item: Serializer<T>, validate?: ValueValidator<T>): Serializer<T[]> {
  function checked(value: T) {
    if (validate && !validate(value)) throw new Error('Invalid array item')
    return value
  }

  return {
    serialize: values => values.map(value => {
      const raw = item.serialize(checked(value))
      if (raw === '') return '~'
      return raw.replaceAll('%', '%25').replaceAll('~', '%7E').replaceAll(',', '%2C')
    }).join(','),

    deserialize: raw => {
      if (raw === '') return []
      return raw.split(',').map(value => {
        const decoded = value === '~' ? '' : decodeURIComponent(value)
        return checked(item.deserialize(decoded))
      })
    }
  }
}
