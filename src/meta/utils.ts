import type { Component } from 'vue'
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

export function defineMetaDefinition<const C extends MetaContexts>(definition: MetaDefinition<C>) {
  return definition
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

export const parsePageUrl = (input: string): URL => {
  const url = new URL(input)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Expected an HTTP or HTTPS URL')
  return url
}
