export type CompactValue = number | string

export type TagCompactor = {
  compact: (tag: string, contextRegion?: string) => CompactValue
  expand: (value: CompactValue, contextRegion?: string) => Expansion
}

export type Expansion<T = string> = { status: 'ready', value: T }
  | { status: 'loading' }
  | { status: 'unresolved', reason: 'missing' | 'ambiguous' | 'invalid' | 'error' }
