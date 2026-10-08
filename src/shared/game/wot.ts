
export const shellNames = {
  'ARMOR_PIERCING_FSDS': ['БОПС', 'Бронебойный оперённый'],
  'ARMOR_PIERCING': ['ББ', 'Бронебойный'],
  'ARMOR_PIERCING_CR': ['БП', 'Подкалиберный'],
  // 'ARMOR_PIERCING_HE': ['БК', 'Бронебойный каморный'],
  'FLAME': ['ОС', 'Огнемётная смесь'],
  'HIGH_EXPLOSIVE': ['ОФ', 'Осколочно-фугасный'],
  'HOLLOW_CHARGE': ['КС', 'Кумулятивный']
} as const

export type GameVendor = 'wot' | 'mt'
export type GameRegion = 'RU' | 'EU' | 'NA' | 'ASIA' | 'CT' | (string & {})
export function gameToRegion(game: GameVendor): 'RU' | 'EU' { return game === 'mt' ? 'RU' : 'EU' }
export function regionToGame(region: GameRegion): GameVendor {
  return region === 'RU' || region === 'RPT' || region === 'CT' ? 'mt' : 'wot'
}

export function accountLink(bdid: number, name: string, region: GameRegion) {

  switch (region) {
    case 'RU': return `https://tanki.su/ru/community/accounts/${bdid}-${name}/`
    case 'EU': return `https://worldoftanks.eu/en/community/accounts/${bdid}-${name}/`
    case 'NA': return `https://worldoftanks.com/en/community/accounts/${bdid}-${name}/`
    case 'ASIA': return `https://worldoftanks.asia/en/community/accounts/${bdid}-${name}/`
    case 'CN': return `https://wotgame.cn/en/community/accounts/${bdid}-${name}/`
    default: return `https://worldoftanks.eu/en/community/accounts/${bdid}-${name}/`
  }
}
