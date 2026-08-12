import { InteractionGeometry } from './InteractionGeometry'

export type InteractionSource = object

export type InteractionIdentity = {
  readonly source: InteractionSource
  readonly kind: string
  readonly key: unknown
}

export function isSameIdentity(a: InteractionIdentity, b: InteractionIdentity): boolean {
  if (a === b) return true
  return a.source === b.source && a.kind === b.kind && a.key === b.key
}

export interface InteractionHit<
  TDatum = unknown,
  TKind extends string = string,
  TGeometryScope extends string = never,
> {
  readonly kind: TKind
  readonly source: InteractionSource
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

export type GeometryScopeOf<THit extends InteractionHit> = THit extends InteractionHit<any, any, infer TScope> ? TScope : never

export function geometryForScope<THit extends InteractionHit>(hit: THit, scope: GeometryScopeOf<THit> | undefined): InteractionGeometry | null {
  if (scope === undefined) return hit.geometry
  return hit.geometryFor(scope as never)
}
