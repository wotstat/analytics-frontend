export const battleModes = [
  'REGULAR',
  'COMP7',
  'SORTIE_2',
  'VERSUS_AI',
  'BATTLE_ROYALE_SOLO',
  'FUN_RANDOM',
  'RANKED',
  'TRAINING',
  'BOB',
  'EPIC_BATTLE',
  'EPIC_RANDOM',
  'COSMIC_EVENT',
  'WHITE_TIGER',
  'PORTAL',
  'HB_DEFENCE',
  'RANDOM_NP2',
  'FORT_BATTLE_2',
  'GLOBAL_MAP',
  'HB_OFFENCE',
  'MAPBOX',
  'HISTORICAL_BATTLES',
  'LAST_STAND_HARD',
  'BATTLE_ROYALE_SQUAD',
  'MAPS_TRAINING',
  'GRINCH',
  'RACES',
  'EVENT_BATTLES',
  'TOURNAMENT_REGULAR',
  'LAST_STAND',
  'LAST_STAND_MEDIUM',
  'COMP7_LIGHT',
  'STORY_MODE',
  'STORY_MODE_REGULAR',
  'HALLOWEEN',
  'HALLOWEEN_MEDIUM',
  'HALLOWEEN_HARD',
  'WINBACK',
  'EPIC_RANDOM_TRAINING',
  'HALLOWEEN_DEFENCE',
  'STORY_MODE_ONBOARDING',
  'TRAINING_COMP7',
  'TOURNAMENT_COMP7',
  'WHITE_TIGER_2',
  'BATTLE_ROYALE_TRN_SOLO',
  'EVENT_BATTLES_2',
  'BATTLE_ROYALE_TRN_SQUAD'
] as const

export type BattleMode = typeof battleModes[number] | (string & {})

export const battleGameplays = [
  'ctf',
  'comp7',
  'domination',
  'assault',
  'assault2',
  'bob',
  'epic',
  'ctf30x30',
  'maps_training',
  'domination3',
  'bootcamp',
] as const

export type BattleGameplay = typeof battleGameplays[number] | (string & {})


export const battleModeNames = {
  REGULAR: 'Случайный бой',
  EPIC_RANDOM: 'Генеральное сражение',
  RANDOM_NP2: 'Случайный бой (для новичков)',
  EPIC_RANDOM_TRAINING: 'Генеральное сражение: тренировка',
  COMP7: 'Натиск',
  COMP7_LIGHT: 'Натиск: Лайт',
  RANKED: 'Ранги',
  TOURNAMENT_REGULAR: 'Турниры',
  TOURNAMENT_COMP7: 'Турниры: Натиск',
  GLOBAL_MAP: 'Глобальная карта',
  SORTIE_2: 'Вылазки',
  FORT_BATTLE_2: 'Наступление',
  BOB: 'Битва блогеров',
  EPIC_BATTLE: 'Линия фронта',
  HISTORICAL_BATTLES: 'Исторический бой',
  BATTLE_ROYALE_SOLO: 'Стальной охотник (соло)',
  BATTLE_ROYALE_SQUAD: 'Стальной охотник (взвод)',
  BATTLE_ROYALE_TRN_SOLO: 'Стальной охотник: тренировка (соло)',
  BATTLE_ROYALE_TRN_SQUAD: 'Стальной охотник: тренировка (взвод)',
  COSMIC_EVENT: 'На Марс!',
  FUN_RANDOM: 'Аркада',
  EVENT_BATTLES: 'Последний Waffenträger',
  EVENT_BATTLES_2: 'Последний Waffenträger: против блогеров',
  GRINCH: 'Зимний рейд',
  HALLOWEEN: 'Вавилон: Запретная зона',
  HALLOWEEN_DEFENCE: 'Проект Вавилон',
  HALLOWEEN_MEDIUM: 'Вавилон: Запретная зона (средний)',
  HALLOWEEN_HARD: 'Вавилон: Запретная зона (сложный)',
  HB_OFFENCE: 'Время героев: Прорыв',
  HB_DEFENCE: 'Время героев: Оборона',
  LAST_STAND: 'Последний рубеж',
  LAST_STAND_MEDIUM: 'Последний рубеж: тяжело',
  LAST_STAND_HARD: 'Последний рубеж: жесть',
  MAPBOX: 'Разведка боем',
  PORTAL: 'Разлом',
  RACES: 'Гонки',
  STORY_MODE: 'Сценарии для новичков',
  STORY_MODE_ONBOARDING: 'Сюжетный режим: введение',
  STORY_MODE_REGULAR: 'Сюжетный режим: обычный',
  VERSUS_AI: 'Полигон',
  WHITE_TIGER: 'Последний Waffenträger',
  WHITE_TIGER_2: 'Последний Waffenträger: против блогеров',
  WINBACK: 'Случайный бой (разминка)',
  MAPS_TRAINING: 'Топография',
  TRAINING: 'Тренировочные комнаты',
  TRAINING_COMP7: 'Тренировка Натиска',
} satisfies Record<BattleMode, string>

export const battleGameplaysNames = {
  'ctf': 'Стандартный',
  'comp7': 'Натиск',
  'domination': 'Встречный',
  'assault': 'Штурм',
  'assault2': 'Атака / Оборона',
  'bob': 'Битва блогеров',
  'epic': 'Линия фронта',
  'ctf30x30': 'Генеральное сражение',
  'maps_training': 'Топография',
  'domination3': 'Столкновение',
  'bootcamp': 'Учебный лагерь',
} satisfies Record<BattleGameplay, string>

export const battleGameplaysOverrides = {
  'REGULAR': {
    'ctf': 'Стандартный',
    'domination': 'Встречный',
    'assault': 'Штурм',
  },
} satisfies Partial<Record<BattleMode, Partial<Record<BattleGameplay, string>>>>

export function battleGameplayName(gameplay: BattleGameplay, mode?: BattleMode) {
  const gameplayName = battleGameplaysNames[gameplay as keyof typeof battleGameplaysNames] || gameplay
  if (!mode) return gameplayName

  const overrides = battleGameplaysOverrides[mode as keyof typeof battleGameplaysOverrides]
  if (overrides && overrides[gameplay as keyof typeof overrides]) {
    return overrides[gameplay as keyof typeof overrides]
  }

  return gameplayName
}

export function battleModeName(mode: BattleMode, gameplay?: BattleGameplay) {
  const modeName = battleModeNames[mode as keyof typeof battleModeNames] || mode

  if (gameplay !== undefined) return `${modeName} (${battleGameplayName(gameplay, mode)})`

  return modeName
}
