import type { Query } from '@/db/client'

export type ContextServices = { query: Query, signal: AbortSignal }

export type MetaContextDefinition<T = unknown> = {
  id: string
  initialWaitMs: number
  refreshIntervalMs: number
  load: (services: ContextServices) => Promise<T>
}

export type MetaContexts = Record<string, MetaContextDefinition>
export type ContextValues<C extends MetaContexts> = {
  readonly [K in keyof C]: Awaited<ReturnType<C[K]['load']>> | undefined
}
