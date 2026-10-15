import type { Query } from '@/db/client'

export type MetaContextDefinition<T = unknown> = {
  id: string
  initialWaitMs: number
  refreshIntervalMs: number
  load: (services: { query: Query, signal: AbortSignal }) => Promise<T>
}

export type MetaContexts = Record<string, MetaContextDefinition>
export type ContextValues<C extends MetaContexts> = {
  readonly [K in keyof C]: Awaited<ReturnType<C[K]['load']>> | undefined
}
