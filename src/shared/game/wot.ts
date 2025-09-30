
export const shellNames = {
  'ARMOR_PIERCING_FSDS': ['БОПС', 'Бронебойный оперённый'],
  'ARMOR_PIERCING': ['ББ', 'Бронебойный'],
  'ARMOR_PIERCING_CR': ['БП', 'Подкалиберный'],
  // 'ARMOR_PIERCING_HE': ['БК', 'Бронебойный каморный'],
  'FLAME': ['ОС', 'Огнемётная смесь'],
  'HIGH_EXPLOSIVE': ['ОФ', 'Осколочно-фугасный'],
  'HOLLOW_CHARGE': ['КС', 'Кумулятивный']
} as const

export const customBattleModes = {
  'normalAny': { title: 'Случайный бой', mode: 'REGULAR' },
  'normalCft': { title: 'Случайный бой (Стандартный)', mode: 'REGULAR', gameplay: 'ctf' },
  'normalDomination': { title: 'Случайный бой (Встречный)', mode: 'REGULAR', gameplay: 'domination' },
  'normalAssault': { title: 'Случайный бой (Штурм)', mode: 'REGULAR', gameplay: 'assault' },
  'bob': { title: 'Битва Блогеров 2025', mode: 'BOB' },
  'epicRandom': { title: 'Генеральное сражение', mode: 'EPIC_RANDOM' },
  'epicBattle': { title: 'Линия фронта', mode: 'EPIC_BATTLE' },
  'tournament-regular': { title: 'Турниры', mode: 'TOURNAMENT_REGULAR' },
  'historical': { title: 'Исторический ивент', mode: 'HISTORICAL_BATTLES' },
  'battleRoyaleSolo': { title: 'Стальной охотник (соло)', mode: 'BATTLE_ROYALE_SOLO' },
  'battleRoyaleSquad': { title: 'Стальной охотник (взвод)', mode: 'BATTLE_ROYALE_SQUAD' },
  'ranked': { title: 'Ранги', mode: 'RANKED' },
  'comp7': { title: 'Натиск', mode: 'COMP7' },
  'globalMap': { title: 'Глобальная карта', mode: 'GLOBAL_MAP' },
  'sortie': { title: 'Вылазки', mode: 'SORTIE_2' },
  'fortBattle': { title: 'Битва за укрепрайон', mode: 'FORT_BATTLE_2' },
  'mapsTraining': { title: 'Топография', mode: 'MAPS_TRAINING' },
  'cosmic': { title: 'Космический режим', mode: 'COSMIC_EVENT' },
  'funRandom': { title: 'Фан рандом', mode: 'FUN_RANDOM' },
  'training': { title: 'Тренировочные комнаты', mode: 'TRAINING' },
} as const

export const gameplayTypes = {
  'ctf': 'Стандартный',
  'domination': 'Встречный',
  'assault': 'Штурм',
  'maps_training': 'Топография',
  'assault2': 'Штурм 2',
  'ctf30x30': 'Стандартный 30x30',
  'epic': 'Генеральное сражение',
} as const

export const modeCount = {
  'normalAny': 15,
  'normalCft': 15,
  'normalDomination': 15,
  'normalAssault': 15,
  'ranked': 10,
  'epicRandom': 30,
  'comp7': 7,
} as const

export type GameVendor = 'wot' | 'mt'
export function gameToRegion(game: GameVendor): 'RU' | 'EU' { return game === 'mt' ? 'RU' : 'EU' }
export function regionToGame(region: 'RU' | 'EU' | 'NA' | (string & {})): GameVendor {
  return region === 'RU' || region === 'RPT' ? 'mt' : 'wot'
}

export const customBattleModesKeys = Object.keys(customBattleModes) as (keyof typeof customBattleModes)[]
