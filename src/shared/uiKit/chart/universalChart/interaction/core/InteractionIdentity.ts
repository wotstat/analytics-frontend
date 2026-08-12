// TODO: WTF

export type InteractionIdentityKind =
  | 'source'
  | 'series'
  | 'dataset'
  | 'group'
  | 'item'


export type InteractionSource = object & {
  identityKeyEquals?(a: unknown, b: unknown): boolean
}

export type InteractionIdentity = {
  readonly source: InteractionSource
  readonly kind: InteractionIdentityKind
  readonly key: unknown
}

export function isSameIdentity(a: InteractionIdentity, b: InteractionIdentity): boolean {
  if (a === b) return true
  if (a.source !== b.source || a.kind !== b.kind) return false
  return a.source.identityKeyEquals?.(a.key, b.key) ?? a.key === b.key
}
