const files = import.meta.glob('/src/shared/game/components/efficiencyIcon/assets/*.svg')

export const iconFileKeys = Object.keys(files)
  .map(path => path.split('/').pop()!.replace('.svg', ''))
  .sort()
