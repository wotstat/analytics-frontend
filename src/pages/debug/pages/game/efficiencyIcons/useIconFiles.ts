export const iconFileKeys = Object.keys(import.meta.glob('/src/shared/game/components/efficiencyIcon/assets/*.svg'))
  .map(path => path.split('/').pop()!.replace('.svg', ''))
  .sort()
