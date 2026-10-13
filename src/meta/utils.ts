import type { Component } from 'vue'

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

export type MetaDefinition = {
  id: string
  priority: number
  match: string | ((url: URL) => boolean)
  meta: MetaTags | ((url: URL) => MetaTags)
  component?: Component
  cache?: { htmlSeconds?: number, imageSeconds?: number }
  name?: string
  summary?: string
  examples?: readonly { name: string, url: string }[]
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

export const resolveMeta = (url: URL): PageMeta => {
  const definition = metaDefinitions.find(({ match }) => {
    if (typeof match === 'function') return match(url)
    return match === '*' || match === url.pathname
  })

  if (!definition) throw new Error(`No meta definition matches URL: ${url.href}`)
  const tags = typeof definition.meta === 'function' ? definition.meta(url) : definition.meta

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
