export type CompactValue = number | string

export type Expansion<T = string> = { status: 'ready', value: T }
  | { status: 'loading' }
  | { status: 'unresolved', reason: 'missing' | 'ambiguous' | 'invalid' | 'error' }
