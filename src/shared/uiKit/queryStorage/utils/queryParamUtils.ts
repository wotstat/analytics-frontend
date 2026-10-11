import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { unref } from 'vue'
import type { QueryParam } from '../queryStorageTypes'

export type Encoded = string | null | undefined
export type QuerySnapshot = Readonly<LocationQuery | LocationQueryRaw>

export function defaultValue(definition: QueryParam) {
  if (typeof definition.default === 'function') return definition.default()
  return structuredClone(definition.default)
}

function paramContext(definition: QueryParam, query?: QuerySnapshot): Record<string, any> | undefined {
  if (!query || !definition.context) return undefined
  return Object.fromEntries(Object.entries(definition.context).map(([name, dependency]) => [
    name, decode(dependency, query[dependency.label], query)
  ]))
}

export function paramEnabled(definition: QueryParam, query: QuerySnapshot): boolean {
  if (typeof definition.enabled === 'function') return definition.enabled(paramContext(definition, query) ?? {})
  return unref(definition.enabled) ?? true
}

export function contextDefinitions(definition: QueryParam): QueryParam[] {
  return Object.values(definition.context ?? {}).flatMap(dependency => [dependency, ...contextDefinitions(dependency)])
}

export function assertContext(definition: QueryParam, labels: Set<string>) {
  for (const dependency of Object.values(definition.context ?? {})) {
    if (!dependency.label) throw new Error('useQueryStorage: context dependency requires an explicit label')
    if (labels.has(dependency.label)) throw new Error(`useQueryStorage: circular context dependency "${dependency.label}"`)
    assertContext(dependency, new Set([...labels, dependency.label]))
  }
}

export function sameDefinition(a: QueryParam, b: QueryParam): boolean {
  if (a.type !== b.type || a.serialize !== b.serialize || a.deserialize !== b.deserialize) return false
  if (encode(a, defaultValue(a)) !== encode(b, defaultValue(b))) return false

  const left = Object.entries(a.context ?? {})
  const right = b.context ?? {}
  return left.length === Object.keys(right).length && left.every(([name, dependency]) => {
    const other = right[name]
    return other && dependency.label === other.label && sameDefinition(dependency, other)
  })
}

export function encode(definition: QueryParam, value: any, query?: QuerySnapshot): Encoded {
  if (value === undefined || value === null) return value
  if (definition.serialize) return definition.serialize(value, paramContext(definition, query))
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function decode(definition: QueryParam, raw: unknown, query?: QuerySnapshot): any {
  if (typeof raw !== 'string') return defaultValue(definition)

  try {
    if (definition.deserialize) return definition.deserialize(raw, paramContext(definition, query))

    const initial = defaultValue(definition)

    if (definition.type === Number || (!definition.type && typeof initial === 'number')) {
      if (!raw.trim() || !Number.isFinite(Number(raw))) throw new Error('Invalid number')
      return Number(raw)
    }

    if (definition.type === Boolean || (!definition.type && typeof initial === 'boolean')) {
      if (raw === '1' || raw === 'true') return true
      if (raw === '0' || raw === 'false') return false
      throw new Error('Invalid boolean value')
    }

    if (definition.type !== String && initial !== null && typeof initial === 'object') return JSON.parse(raw)

    return raw
  } catch {
    return defaultValue(definition)
  }
}
