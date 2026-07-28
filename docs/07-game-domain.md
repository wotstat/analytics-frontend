# Игровая доменная модель (`src/shared/game/`)

## Две игры: Lesta («Мир танков», RU) и Wargaming (World of Tanks, EU/NA/ASIA)

- `wot.ts`: тип `GameVendor = 'wot' | 'mt'` (`mt` = Мир танков/Lesta), `GameRegion = 'RU' | 'EU' | 'NA' | 'ASIA' | 'CT' | ...`. Конвертации `gameToRegion` / `regionToGame` (RU/RPT/CT → `mt`). `accountLink(bdid, name, region)` — ссылка на профиль игрока на портале.
- Предпочтение игры пользователем — `src/shared/global/globalPreferred.ts`: `preferredGame` в localStorage (`'mt' | 'wot' | 'any' | 'unknown'`), `preferredGameOrDefault` (дефолт `mt`).
- Версии игры: `gameVersion.ts`; выбор версии в фильтрах — `selectors/gameVersionSelector/`.

## Режимы боёв (`wot.ts`)

- `customBattleModes` — словарь режимов сайта → `{ title, mode, gameplay? }` в терминах БД (`battleMode`, `battleGameplay`): случайные бои (варианты геймплея ctf/domination/assault), `bob` (Битва Блогеров), `comp7` (Натиск), Линия фронта, Стальной охотник, Ранги, ГК, укрепрайон, Топография и т.д. Ключи этого словаря — значения URL-параметра `?mode=`.
- `gameplayTypes` — расшифровки геймплеев; `modeCount` — размер команды по режиму; `shellNames` — типы снарядов (сокращение + полное имя).
- Comp7/Натиск-специфика: `comp7/utils.ts` + `comp7/i18n.json`, иконки рангов `comp7/rank/RankIcon.vue`.

## Танки (`vehicles/`)

- Тег танка — строка вида `nation:Tag` (например `ussr:R45_IS-7`); `tankTagToReadable` (в `i18n/i18n.ts`) делает из тега читаемое имя, если нет локализации.
- `vehicle/VehicleImage.vue` + `utils.ts` — картинки танков (со `STATIC_URL`), `VehicleLevel.vue` — римские уровни (1–11), `type/VehicleType.vue` — иконки классов (LT/MT/HT/AT/SPG), `nations/` — флаги наций из спрайт-атласа (`atlases.json`, `Nation.vue`).

## Арены (`arenas/`)

- `arenas.ts` — данные арен; тег арены — `spaces/xxx` (в локализации без префикса).
- `minimap/Minimap.vue` — миникарта с фоном (`minimapBackground/`) и базами (`minimapBases/`); фоны — со статик-сервера.

## Селекторы фильтров (`selectors/`)

Комплект UI для выбора фильтров статистики. Единственный боевой потребитель — `pages/replays/search/Index.vue`; `SearchLine` отдельно переиспользован в `onslaught/shared/settings/nicknameInput/`. В настройках инфографики этих селекторов **нет**.

- `vehicleSelector/` — выбор танков: попап с таблицей (`VehiclePopup`, `VehicleTable`), бейджи выбранного (`VehicleSelectorBadges`).
- `arena/` — выбор карт (модалка + бейджи).
- `gameVersionSelector/`, `gameSelector/` — версия игры и игра (Lesta/WG).
- Общие части: `components/badges/` — `Badge.vue`, `BadgesLine.vue` (обычный `flex-wrap`, бейджи переносятся и растят фильтр по высоте: свёртки в «+N» нет) и `BadgesLinePopover.vue` (строка бейджей, по клику открывающая попап выбора); `components/searchLine/SearchLine.vue`.
- Кнопки «Lesta / WG» внутри попапов техники, карт и версий пишут в **глобальный** `preferredGame` (`shared/global/`, localStorage), то есть локальный контрол фильтра меняет предпочтение игры на всём сайте. `GameSelector` к этому предпочтению, наоборот, не подключён.

`BadgesLinePopover` и надстроенные над ним `VehicleSelectorBadges` / `GameVersionSelectorBadges` пробрасывают в `PopoverAutoClose` проп `closeOnOutsideWindow` (см. 05), чтобы условие автозакрытия можно было переопределить на месте использования.

## Локализация и i18n

Два не связанных механизма:

1. **Имена игровых сущностей из БД** — `src/shared/i18n/i18n.ts`: таблицы `VehiclesLocalization` / `ArenasLocalization` грузятся один раз (`LONG_CACHE_SETTINGS`); `getTankName(tag, short?)`, `getArenaName(tag)`; язык — константа `LANGUAGE = 'RU'`, приоритеты регионов в `languageRegionPriority`. Плюс ручные словари: `crewBookName`, `entitlementsName`, `getBestLocalization` (для данных с per-region именами).
   - `countLocalize(count, 'запрос', 'запроса', 'запросов')` — русская плюрализация, используется часто.
2. **UI-переводы** — минималистичный `src/shared/i18n/useI18n.ts`: `useI18n(i18nRecord)` → `t(key)`; словари — локальные `i18n.json` рядом с фичей (пример: `pages/install/mods/i18n.json`, `shared/game/comp7/i18n.json`). Фолбэк be→ru→en. Большинство текстов при этом просто захардкожено по-русски в шаблонах — это норма проекта.

## Иконки эффективности (`efficiencyIcon/`)

`Icon.vue` + `utils.ts` + `i18n.ts` — иконки показателей (урон, фраги, засвет, блок и т.д., картинки в `src/assets/efficiency-icon/`).
