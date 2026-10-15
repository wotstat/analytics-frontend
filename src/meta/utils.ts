import type { Component } from 'vue'
import { createDatabase, type DatabaseConfig, type Query } from '@/db/client'
import { createMetaContexts } from './context/runtime'
import type { ContextValues, MetaContexts } from './context/utils/types'

export const formats = {
  og: { width: 1200, height: 630 },
  twitter: { width: 1200, height: 600 },
}

export type MetaFormat = keyof typeof formats

export type MetaTags = {
  title: string
  description?: string
  imageAlt?: string
}

export type MetaDefinition<C extends MetaContexts = MetaContexts> = {
  id: string
  priority: number
  match: string | ((url: URL) => boolean)
  contexts?: C
  meta: MetaTags | ((url: URL, context: ContextValues<NoInfer<C>>) => MetaTags)
  component?: Component
  cache?: { htmlSeconds?: number, imageSeconds?: number }
  name?: string
  summary?: string
  examples?: readonly { name: string, url: string }[]
}

export function defineMetaDefinition<const C extends MetaContexts>(definition: MetaDefinition<C>): MetaDefinition {
  const meta = definition.meta
  return {
    ...definition,
    meta: typeof meta === 'function' ? (url, context) => meta(url, context as ContextValues<C>) : meta,
  }
}

export type PageMeta = MetaTags & {
  definitionId: string
  hasImage: boolean
  cache: { htmlSeconds: number, imageSeconds: number }
}

export type RenderContext = {
  url: string
  format: MetaFormat
  meta: PageMeta
}

const modules = import.meta.glob<MetaDefinition>('../**/meta-definition.ts', { eager: true, import: 'default' })

export const metaDefinitions = Object.values(modules)
  .map(definition => ({
    ...definition,
    name: definition.name ?? definition.id,
    summary: definition.summary ?? '',
    examples: definition.examples ?? [],
  }))
  .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))

const ids = new Set<string>()
for (const definition of metaDefinitions) {
  if (ids.has(definition.id)) throw new Error(`Duplicate meta definition ID: ${definition.id}`)
  ids.add(definition.id)
}

export const matchMetaDefinition = (url: URL) => {
  const definition = metaDefinitions.find(({ match }) => {
    if (typeof match === 'function') return match(url)
    return match === '*' || match === url.pathname
  })

  if (!definition) throw new Error(`No meta definition matches URL: ${url.href}`)
  return definition
}

export function createServerMetaResolver(database: DatabaseConfig) {
  return createMetaResolver(createDatabase(database).query)
}

export function createMetaResolver(query: Query, onUpdate?: () => void) {
  const contexts = createMetaContexts(
    metaDefinitions.flatMap(definition => Object.values(definition.contexts ?? {})),
    query,
    onUpdate,
  )

  return {
    readMeta: (url: URL) => {
      const definition = matchMetaDefinition(url)
      return resolveDefinition(definition, url, contexts.read(definition.contexts ?? {}))
    },
    resolveMeta: async (url: URL) => {
      const definition = matchMetaDefinition(url)
      await contexts.wait(definition.contexts ?? {})
      return resolveDefinition(definition, url, contexts.read(definition.contexts ?? {}))
    },
    close: contexts.close,
  }
}

function resolveDefinition(definition: MetaDefinition, url: URL, context: Record<string, unknown>): PageMeta {
  const tags = typeof definition.meta === 'function' ? definition.meta(url, context) : definition.meta

  return {
    ...tags,
    definitionId: definition.id,
    hasImage: Boolean(definition.component),
    cache: {
      htmlSeconds: definition.cache?.htmlSeconds ?? 300,
      imageSeconds: definition.cache?.imageSeconds ?? 86400
    },
  }
}

export const parsePageUrl = (input: string): URL => {
  const url = new URL(input)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Expected an HTTP or HTTPS URL')
  return url
}
