import type { MetaContextDefinition } from '@/meta/context/utils/types'
import { WIDGETS_URL } from '@/shared/external/externalUrl'

type Widget = {
  route: string
  name: string
  description: string
  hasPreview: boolean
}

export function getWidgetRoute(url: URL) {
  const match = url.pathname.replace(/\/+$/, '').match(/^\/widgets(\/.*)?$/)
  return match?.[1] ?? null
}

export function getWidgetPreviewUrl(url: URL) {
  return new URL(`/iframe/widget-preview${getWidgetRoute(url)}`, WIDGETS_URL)
}

export const widgetCatalog = {
  id: 'widget-catalog',
  initialWaitMs: 3_000,
  refreshIntervalMs: 5 * 60 * 1000,
  load: async ({ signal }): Promise<ReadonlyMap<string, Readonly<Widget>>> => {
    const response = await fetch(new URL('/widget-catalog.json', WIDGETS_URL), {
      signal: AbortSignal.any([signal, AbortSignal.timeout(8_000)]),
    })
    if (!response.ok) throw new Error(`Widget catalog: HTTP ${response.status}`)

    const entries: unknown = await response.json()
    if (!Array.isArray(entries)) throw new Error('Invalid widget catalog')

    const catalog = new Map<string, Readonly<Widget>>()
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object'
        || typeof entry.route !== 'string' || !/^\/[a-z0-9/-]+$/.test(entry.route)
        || typeof entry.name !== 'string' || !entry.name.trim()
        || typeof entry.description !== 'string' || typeof entry.hasPreview !== 'boolean'
        || catalog.has(entry.route)) throw new Error('Invalid widget catalog entry')

      catalog.set(entry.route, Object.freeze({
        route: entry.route,
        name: entry.name,
        description: entry.description,
        hasPreview: entry.hasPreview,
      }))
    }

    return catalog
  },
} satisfies MetaContextDefinition
