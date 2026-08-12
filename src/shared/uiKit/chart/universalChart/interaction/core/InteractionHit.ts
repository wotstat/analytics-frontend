import { InteractionGeometry } from './InteractionGeometry'

type KeyType = string | number | symbol
export type InteractionIdentity = {
  readonly sourceId: symbol
  readonly kind: string
  readonly key: KeyType
}

export function isSameIdentity(a: InteractionIdentity, b: InteractionIdentity): boolean {
  if (a === b) return true
  return a.sourceId === b.sourceId && a.kind === b.kind && sameKey(a.key, b.key)
}

function sameKey(a: KeyType, b: KeyType): boolean {
  return a === b || (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b))
}

export interface InteractionHit<
  TDatum = unknown,
  TKind extends string = string,
  TGeometryScope extends string = never,
> {
  readonly kind: TKind
  readonly sourceId: symbol
  readonly datum: TDatum
  readonly identity: InteractionIdentity
  readonly memberships: readonly InteractionIdentity[]

  readonly geometry: InteractionGeometry
  geometryFor(scope: TGeometryScope): InteractionGeometry | null

  readonly distance: number
  readonly contains: boolean
  readonly targets: readonly SVGElement[]

  readonly meta?: unknown
}
