import { STATIC_URL } from '@/shared/external/externalUrl'
import type { GameVendor } from '@/shared/game/domain/wot'
import { getArenaMeta } from '@/shared/game/domain/arenas/arenas'

export function tagToImageName(tag: string): string {
  return tag.split('/').at(-1)?.toLowerCase() || tag.toLowerCase()
}

export function minimapUrl(tag: string,
  game: GameVendor = 'mt',
  gameplay: null | 'comp7' | (string & {}) = null,
  format: 'webp' | 'png' = 'webp',
  size: 'small' | 'medium' = 'small'): string {

  if (tag.startsWith('spaces/')) tag = tag.replace('spaces/', '')

  const gamePrefix = game === 'mt' ? 'mt' : 'wot'
  const hasComp7Minimap = gameplay
    ? getArenaMeta(game, tag, gameplay)?.minimap.includes('_comp7') ?? false
    : false

  if (size === 'medium') {
    const fileName = hasComp7Minimap ? 'mmap_comp7' : 'mmap'
    return `${STATIC_URL}/${gamePrefix}/latest/arenas/minimap-medium/${tag}/${fileName}.${format}`
  }

  const directory = hasComp7Minimap ? 'minimap/comp7' : 'minimap'
  return `${STATIC_URL}/${gamePrefix}/latest/arenas/${directory}/${tag}.${format}`
}
