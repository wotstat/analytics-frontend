import type { ArenaRow, VehicleRow, VersionRow } from './lists'

// Заведомо битые и синтетические данные: ими проверяются ветки, до которых на живых данных
// не добраться. Реальные теги для «нормальных» случаев берутся из lists.ts.

export const brokenVehicleTags = [
  'ussr:R999_No_Such_Tank', // формат правильный, техники нет: имя соберётся из тега
  'atlantis:AT01_Kraken', // нации нет в атласе флагов
  'без-двоеточия', // tankTagToReadable вернёт строку как есть
  'ussr:R00_Очень_длинное_название_техники_которое_никуда_не_влезает_и_ломает_строку',
]

export const brokenArenaHashes = [
  '04_himmelsdorf', // хеш без ':team' — hashToArena отдаст team: NaN
  'spaces/05_prohorovka:any', // лишний префикс spaces/ — имя не найдётся
  '99_no_such_arena:any',
  '04_himmelsdorf:7', // команды 7 не бывает
]

export const brokenVersionTags = [
  '9.99', // такой версии нет — строка просто повиснет бейджем
  'не-версия',
  '1.44.0.1 #0',
]

export const longTexts = [
  'Объект 261 Вариант 4 Тест',
  'Chief. Proto Рудный барон',
  'Controcarro 3 Minotauro Испытательный',
  'Очень длинный бейдж без пробелов: ААААААААААААААААААААААААААААААААААААААА',
]

export const longQuery = 'объект 261 вариант 4 тест испытательный прототип рудный барон концепт '.repeat(3)

// Небольшой список техники для попапа без запроса. Только регион RU: переключение на WG
// внутри попапа обязано показать «Танков не найдено».
export const vehicleListFixture: VehicleRow[] = [
  { tag: 'ussr:R45_IS-7', type: 'HT', level: 10, short: 'ИС-7', name: 'ИС-7', region: 'RU', nation: 'ussr' },
  { tag: 'germany:G121_Grille_15_L63', type: 'AT', level: 10, short: 'Grille 15', name: 'Grille 15', region: 'RU', nation: 'germany' },
  { tag: 'italy:It23_CC_3', type: 'AT', level: 10, short: 'Minotauro', name: 'Controcarro 3 Minotauro', region: 'RU', nation: 'italy' },
  { tag: 'uk:GB120_Concept_No_5', type: 'MT', level: 10, short: 'Concept 5', name: 'Concept No. 5', region: 'RU', nation: 'uk' },
  { tag: 'sweden:S11_Strv_103B', type: 'AT', level: 10, short: 'Strv 103B', name: 'Strv 103B', region: 'RU', nation: 'sweden' },
  { tag: 'china:Ch01_Type59', type: 'MT', level: 8, short: 'Type 59', name: 'Type 59', region: 'RU', nation: 'china' },
  { tag: 'ussr:R04_T-34', type: 'MT', level: 5, short: 'Т-34', name: 'Т-34', region: 'RU', nation: 'ussr' },
  // Без локализации: имя соберётся из тега. Заодно попадёт в группу «Тестовые» (суффикс _T).
  { tag: 'ussr:R164_Fake_Test_T', type: 'LT', level: 1, short: '', name: '', region: 'RU', nation: 'ussr' },
]

// Одна карта нарочно из старой версии: с «Только актуальные» её не видно,
// без галки у неё появляется плашка «До 1.43.0».
export const arenaListFixture: ArenaRow[] = [
  { tag: '01_karelia', name: 'Карелия', region: 'RU', battleMode: 'REGULAR', battleGameplay: 'ctf', gameVersion: 'ru_1.44.0', season: 'summer' },
  { tag: '04_himmelsdorf', name: 'Химмельсдорф', region: 'RU', battleMode: 'REGULAR', battleGameplay: 'ctf', gameVersion: 'ru_1.44.0', season: 'summer' },
  { tag: '05_prohorovka', name: 'Прохоровка', region: 'RU', battleMode: 'REGULAR', battleGameplay: 'ctf', gameVersion: 'ru_1.44.0', season: 'summer' },
  { tag: '06_ensk', name: 'Энск', region: 'RU', battleMode: 'REGULAR', battleGameplay: 'domination', gameVersion: 'ru_1.44.0', season: 'summer' },
  { tag: '02_malinovka', name: 'Малиновка', region: 'RU', battleMode: 'REGULAR', battleGameplay: 'assault', gameVersion: 'ru_1.44.0', season: 'summer' },
  { tag: '08_ruinberg', name: 'Руинберг', region: 'RU', battleMode: 'REGULAR', battleGameplay: 'ctf', gameVersion: 'ru_1.43.0', season: 'summer' },
  // Без локализации: вместо имени показывается тег.
  { tag: '99_no_such_arena', name: '', region: 'RU', battleMode: 'REGULAR', battleGameplay: 'ctf', gameVersion: 'ru_1.44.0', season: 'winter' },
]

export const versionListFixture: VersionRow[] = [
  { region: 'RU', version: 'v.1.44.0.1 #1580' },
  { region: 'RU', version: 'v.1.44.0.0 #1571' },
  { region: 'RU', version: 'v.1.43.1.2 #1550' },
  { region: 'RU', version: 'v.1.43.0.0 #1499' },
  { region: 'PT_RU', version: 'v.1.44.0.1 #1581' },
  { region: 'EU', version: 'v.2.3.1.0 #908' },
  { region: 'EU', version: 'v.2.3.0.0 #880' },
  { region: 'CT', version: 'v.2.3.1.0 Common Test #901' },
]

// Вторая строка не проходит regex в GameVersionPopup — и попап падает на рендере.
export const brokenVersionListFixture: VersionRow[] = [
  { region: 'RU', version: 'v.1.44.0.1 #1580' },
  { region: 'RU', version: '1.44.0.1' },
]

// Названия для проверки подсветки: кириллица, латиница, диакритика, цифры, пустая строка.
export const highlightSamples = [
  'Т-34',
  'Т-34-85',
  'ИС-7',
  'Объект 268 Вариант 4',
  'Škoda T 56',
  'CS-63',
  'Löwe',
  'Bat.-Châtillon 25 t',
  'AMX 13 105',
  'Progetto M40 mod. 65',
  'STB-1',
  'Type 59',
  '  пробелы по краям  ',
  '',
]
