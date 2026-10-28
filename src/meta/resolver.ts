import type { Query } from '@/db/client'
import { createMetaContexts } from './context/runtime'
import type { MetaDefinition, PageMeta, RequestContext } from './utils'
import { metaDefinitions, matchMetaDefinition } from './definitions'

export { createDatabase } from '@/db/client'
export { formats } from './utils'
export { metaDefinitions, matchMetaDefinition } from './definitions'

export function createMetaResolver(query: Query, onUpdate?: () => void) {
  const contexts = createMetaContexts(
    metaDefinitions.flatMap(definition => Object.values(definition.contexts ?? {})),
    query,
    onUpdate,
  )

  return {
    warmup: contexts.warmup,
    readMeta: (url: URL, request: RequestContext) => {
      const definition = matchMetaDefinition(url)
      return resolveDefinition(definition, url, contexts.read(definition.contexts ?? {}), request)
    },
    resolveMeta: async (url: URL, request: RequestContext) => {
      const definition = matchMetaDefinition(url)
      await contexts.wait(definition.contexts ?? {})
      return resolveDefinition(definition, url, contexts.read(definition.contexts ?? {}), request)
    },
    close: contexts.close,
  }
}

function resolveDefinition(definition: MetaDefinition, url: URL, context: Record<string, unknown>, request: RequestContext): PageMeta {
  const tags = typeof definition.meta === 'function' ? definition.meta(url, context, request) : definition.meta
  const { revisionKey, props } = definition

  return {
    ...tags,
    definitionId: definition.id,
    hasImage: Boolean(definition.component),
    props: typeof props === 'function' ? props(url, context, request) : props,
    revisionKey: typeof revisionKey === 'function' ? revisionKey(url, context, request) : revisionKey,
    cache: {
      htmlSeconds: definition.cache?.htmlSeconds ?? 15,
      imageSeconds: definition.cache?.imageSeconds ?? 86400
    },
  }
}
