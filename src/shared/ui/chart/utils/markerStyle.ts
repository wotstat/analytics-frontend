export type MarkerStyle = 'outlined' | 'classic' | 'glow'

export function resolveMarkerStyle(style: MarkerStyle | undefined, itemCount: number): MarkerStyle {
  return style ?? (itemCount > 5 ? 'outlined' : 'classic')
}
