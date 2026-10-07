import type { MaybeRefOrGetter, Ref } from 'vue'

export type QueryWriteOptions = {
  history?: 'push' | 'replace'
  debounce?: number
}

export type QueryStorageOptions = QueryWriteOptions & {
  enabled?: MaybeRefOrGetter<boolean>
}

export type QueryParam<T = any> = QueryWriteOptions & {
  type?: StringConstructor | NumberConstructor | BooleanConstructor
  label?: string
  key?: string
  default?: T | (() => T)
  serialize?: (value: T) => string
  deserialize?: (value: string) => T
}

export type QueryParams = Record<string, QueryParam>

type DefaultValue<P> = P extends { default: infer D } ? D extends () => infer T ? T : D : undefined
type ParamValue<P> = P extends { deserialize: (value: string) => infer T } ? T
  : P extends { type: StringConstructor } ? string
    : P extends { type: NumberConstructor } ? number
      : P extends { type: BooleanConstructor } ? boolean
        : DefaultValue<P>

export type QueryValues<P extends QueryParams> = {
  [K in keyof P]: ParamValue<P[K]> | DefaultValue<P[K]>
}

export type QueryStorage<P extends QueryParams> = {
  params: { [K in keyof P]: Ref<QueryValues<P>[K]> }
  patch: (values: Partial<QueryValues<P>>, options?: QueryWriteOptions) => void
  flush: (key?: keyof P) => Promise<void>
}

export function defineParams<P extends QueryParams>(params: P): P {
  return params
}
