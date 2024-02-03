export const battleGameplays = {
  'ctf': 'Стандартный бой',
  'domination': 'Встречный бой',
  'assault': 'Штурм',
  'nations': 'Противостояние',
  'ctf2': 'Завоевание',
  'assault2': 'Атака/Оборона',
  'fallout': '«Стальная охота»',
  'fallout2': '«Стальная охота» 2',
  'fallout3': '«Стальная охота» 3',
  'fallout4': '«Превосходство»',
  'ctf30x30': 'Генеральное сражение',
  'domination30x30': 'Ген. ражение встречка',
  'epic': 'Линия фронта',
  'comp7': 'Натиск'
} as const

export const battleGameplaysKeys = Object.keys(battleGameplays) as (keyof typeof battleGameplays)[];


export const battleModes = {
  'REGULAR': 'Обычный режим',
  'RANKED': 'Ранги',
  'MAPS_TRAINING': 'Топография',
  'EPIC_RANDOM': 'Линия фронта',
} as const

export const battleModesKeys = Object.keys(battleModes) as (keyof typeof battleModes)[];
