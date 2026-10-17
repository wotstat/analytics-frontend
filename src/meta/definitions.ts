import type { MetaDefinition } from './utils'

const modules = import.meta.glob<MetaDefinition>([
  '../**/meta-definition.ts',
  '../**/*-meta-definition.ts',
], { eager: true, import: 'default' })

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

