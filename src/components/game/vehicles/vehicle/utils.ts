import { SpriteAtlas } from '@/components/uiKit/spriteAtlas/SpriteAtlas'
import { STATIC_URL } from '@/utils/externalUrl'

export function tagToImageName(tag: string): string {
  return tag.split(':').at(-1)?.toLowerCase() || tag.toLowerCase()
}

export function vehicleUrl(tag: string, size: 'small' | 'preview' | 'shop' = 'preview', format: 'webp' | 'png' = 'webp'): string {
  const name = tagToImageName(tag)
  switch (size) {
    case 'small': return `${STATIC_URL}/mt/latest/vehicles/small/${name}.${format}`
    case 'preview': return `${STATIC_URL}/mt/latest/vehicles/preview/${name}.${format}`
    case 'shop': return `${STATIC_URL}/mt/latest/vehicles/shop/${name}.${format}`
  }
}

export function vehicleFallbackUrl(size: 'small' | 'preview' | 'shop' = 'preview', format: 'webp' | 'png' = 'webp') {
  switch (size) {
    case 'small': return `${STATIC_URL}/mt/latest/vehicles/small/no-image.${format}`
    case 'preview': return `${STATIC_URL}/mt/latest/vehicles/preview/no-image.${format}`
    case 'shop': return `${STATIC_URL}/mt/latest/vehicles/shop/no-image.${format}`
  }
}

export const smallVehiclesAtlasMt = new SpriteAtlas({ atlasRoot: `${STATIC_URL}/mt/latest/vehicles/small/atlas/1024`, classPrefix: 'mt-small-vehicles-background' })
export const smallVehiclesAtlasWot = new SpriteAtlas({ atlasRoot: `${STATIC_URL}/wot/latest/vehicles/small/atlas/1024`, classPrefix: 'wot-small-vehicles-background' })