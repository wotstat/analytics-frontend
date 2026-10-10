export type Serializer<T> = {
  serialize: (value: T) => string
  deserialize: (raw: string) => T
}

export type ValueValidator<T> = (value: T) => boolean
