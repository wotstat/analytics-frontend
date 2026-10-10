import { STATIC_URL } from '@/shared/external/externalUrl'
import type { GameVendor } from '@/shared/game/domain/wot'
import type { SkillTag } from '@/shared/game/domain/comp7/utils'

export function skillImageUrl(tag: SkillTag | (string & {}),
  game: GameVendor = 'mt',
  season: 'latest' | (string & {}) = 'latest',
  format: 'webp' | 'png' = 'webp') {

  const gamePrefix = game === 'mt' ? 'mt' : 'wot'
  return `${STATIC_URL}/${gamePrefix}/latest/comp7/skills/${season}/${tag}.${format}`
}
