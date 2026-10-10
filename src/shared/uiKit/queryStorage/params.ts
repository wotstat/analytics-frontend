import type { QueryParam } from './queryStorageTypes'
import { arraySerializer } from './serializers/arraySerializer'
import { dateSerializer, type DatePrecision } from './serializers/dateSerializer'
import { numberSerializer } from './serializers/numberSerializer'
import { oneOfSerializer } from './serializers/oneOfSerializer'
import { setSerializer } from './serializers/setSerializer'
import { setOfSerializer } from './serializers/setOfSerializer'
import { stringSerializer } from './serializers/stringSerializer'
import type { Serializer, ValueValidator } from './serializers/types'

export type ParamOptions = Omit<QueryParam, 'type' | 'default' | 'serialize' | 'deserialize'> & {
  type?: never
  default?: never
  serialize?: never
  deserialize?: never
}

type ParamDefault<T> = T | null | undefined | (() => T | null | undefined)
type CollectionOptions<T> = ParamOptions & { validate?: ValueValidator<T> }
type SetDefault<T> = Iterable<T> | (() => Iterable<T>)
type NormalizedSetDefault<T, D> = D extends () => Iterable<T> ? () => Set<T> : Set<T>
type DateOptions = ParamOptions & { precision?: DatePrecision }
type ParamSettings<O> = Omit<O, 'type' | 'default' | 'serialize' | 'deserialize'>

function withOptions<P, O = {}>(definition: P, options?: O): P & ParamSettings<O> {
  return { ...options, ...definition } as P & ParamSettings<O>
}

function setDefault<T, D extends SetDefault<T>>(value: D): NormalizedSetDefault<T, D> {
  if (typeof value === 'function') return (() => new Set(value())) as NormalizedSetDefault<T, D>
  return new Set(value) as NormalizedSetDefault<T, D>
}

export function stringParam<D extends ParamDefault<string>, O extends ParamOptions = {}>(defaultValue: D, options?: O) {
  return withOptions({ ...stringSerializer, default: defaultValue }, options)
}

export function numberParam<D extends ParamDefault<number>, O extends ParamOptions = {}>(defaultValue: D, options?: O) {
  return withOptions({ ...numberSerializer, default: defaultValue }, options)
}

export function booleanParam<D extends ParamDefault<boolean>, O extends ParamOptions = {}>(defaultValue: D, options?: O) {
  return withOptions({ type: Boolean, default: defaultValue }, options)
}

export function dateParam<D extends ParamDefault<Date>, O extends DateOptions = {}>(defaultValue: D, options?: O) {
  const { precision, ...settings } = (options ?? {}) as O
  return withOptions({ ...dateSerializer(precision), default: defaultValue }, settings)
}

export function oneOfParam<const T extends string | number, D extends ParamDefault<NoInfer<T>>, O extends ParamOptions = {}>(
  values: readonly T[], defaultValue: D, options?: O
) {
  return withOptions({ ...oneOfSerializer(values), default: defaultValue }, options)
}

export function arrayParam<T, O extends CollectionOptions<T> = {}>(
  item: Serializer<T>, defaultValue: NoInfer<T>[] | (() => NoInfer<T>[]), options?: O & CollectionOptions<T>
) {
  const { validate, ...settings } = (options ?? {}) as O & CollectionOptions<T>
  return withOptions({ ...arraySerializer(item, validate), default: defaultValue }, settings)
}

export function setParam<T, D extends SetDefault<NoInfer<T>>, O extends CollectionOptions<T> = {}>(
  item: Serializer<T>, defaultValue: D, options?: O & CollectionOptions<T>
) {
  const { validate, ...settings } = (options ?? {}) as O & CollectionOptions<T>
  return withOptions({ ...setSerializer(item, validate), default: setDefault<T, D>(defaultValue) }, settings)
}

export function setOfParam<const T extends string | number, D extends SetDefault<NoInfer<T>>, O extends ParamOptions = {}>(
  values: readonly T[], defaultValue: D, options?: O
) {
  return withOptions({ ...setOfSerializer(values), default: setDefault<T, D>(defaultValue) }, options)
}
