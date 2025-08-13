import { SpriteAtlas } from '@/components/spriteAtlas/SpriteAtlas'

import AtlasesJson from './60x40/atlas/atlases.json'
import Atlas0 from './60x40/atlas/atlas_0.png?url'


export const nationFlagAtlas = new SpriteAtlas({
  classPrefix: 'nation-flags-background',
  atlasesInfo: AtlasesJson,
  atlasesImages: {
    0: Atlas0,
  },
})