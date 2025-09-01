import { STATIC_URL } from '@/shared/external/externalUrl'

export function tagToImageName(tag: string): string {
  return tag.split('/').at(-1)?.toLowerCase() || tag.toLowerCase()
}

export function minimapUrl(tag: string, game: 'mt' | 'wot' = 'mt', format: 'webp' | 'png' = 'webp'): string {
  return `${STATIC_URL}/${game}/latest/arenas/minimap/${tag}.${format}`
}