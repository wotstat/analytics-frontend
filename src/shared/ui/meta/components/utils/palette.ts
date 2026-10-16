import type { InjectionKey, ShallowRef } from 'vue'

export const metaCardSecondaryColors = {
  blue: '#c4cede',
  slate: '#abb3bf',
  olive: '#cdd4bf',
  neutral: '#c6cfd2',
  lavender: '#ccd2e6',
  violet: '#d4cde4',
  teal: '#c4d3d4',
  copper: '#d6c8b8',
} as const

export type MetaCardPalette = keyof typeof metaCardSecondaryColors

export const metaCardPaletteKey: InjectionKey<ShallowRef<MetaCardPalette>> = Symbol('meta-card-palette')
