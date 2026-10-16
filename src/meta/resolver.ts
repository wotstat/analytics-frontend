import type { Query } from '@/db/client'
import { createMetaContexts } from './context/runtime'
import type { MetaDefinition, PageMeta } from './utils'

export { createDatabase } from '@/db/client'
export { formats } from './utils'

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

export function createMetaResolver(query: Query, onUpdate?: () => void) {
  const contexts = createMetaContexts(
    metaDefinitions.flatMap(definition => Object.values(definition.contexts ?? {})),
    query,
    onUpdate,
  )

  return {
    warmup: contexts.warmup,
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
  const { revisionKey } = definition

  return {
    ...tags,
    definitionId: definition.id,
    hasImage: Boolean(definition.component),
    revisionKey: typeof revisionKey === 'function' ? revisionKey(url, context) : revisionKey,
    cache: {
      htmlSeconds: definition.cache?.htmlSeconds ?? 300,
      imageSeconds: definition.cache?.imageSeconds ?? 86400
    },
  }
}
