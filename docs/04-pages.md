# Страницы сайта (`src/pages/`)

## Главная — `pages/Main.vue`
Лендинг: описание сервиса, ссылки на разделы, реалтайм-счётчики (через `useAnalyticsRealtime`). Горизонтальные карусели — `pages/shared/HorizontalScrollItems.vue`.

## Сессионная инфографика — `pages/infographics/` (маршрут `/session`)

Ядро сайта: личная статистика игрока по событиям мода.

- `Index.vue` — лейаут: `SidebarLayout` (сайдбар с навигацией по под-страницам), заголовок `SettingsTitle`/`StatParamsTitle` (текущие фильтры), `TankList` (список танков за период с чекбоксами → фильтр `?tank=`). `RouterView` в `KeepAlive`; ключ пересоздаёт страницу при смене фильтров, кроме маршрутов с meta `preventRemountOnStatChange`.
- `settings/Settings.vue` — панель фильтров: ник, режим, период, уровень, тип танка. Меняет query-параметры URL (источник правды — URL, см. `useQueryStatParams`).
- Под-страницы `pages/`:
  - `Battle.vue` — карточки о боях: количество, времена (очередь, бой, жизнь), винрейт, распределение длительности.
  - `shots/Shots.vue` — стрельба: точность, серверный/клиентский разброс, точки попадания на круге сведения (`ShotsCircle`), инфо о снарядах (`shotInfo/`).
  - `Damage.vue` — урон: распределения, `ShotDistribution`.
  - `Results.vue` — результаты боёв (`PlayerResultTable`, `TeamLevelTable`).
  - `Maps.vue` — карты: винрейт/статистика по аренам (`MapsTable`), миникарты.
  - `Coverage.vue` — «покрытие»: сколько игроков встречено (`PlayerCoverageTable`, MV `player_coverage_*`).
  - `chuck/Chuck.vue` — турнир «Чак Норрис» (ивент), `ChuckTable`.
  - `lootbox/` — статистика открытия лутбоксов: таблицы дропа, реролов; свой набор таблиц (`Table.vue`, `OpenByTable.vue`, `RerollTable.vue`, список контейнеров `lootboxList/`).
  - `onslaught/` — см. ниже.
- `shared/widgets/` — переиспользуемые карточки-виджеты страниц: `GenericInfo.vue` (большое число + подпись + цвет, принимает `status`, `value`, `processor`), `GenericInfoQuery.vue` (то же с запросом внутри), таблицы, `charts/MiniBar.vue`, `charts/MiniPie.vue` и Shadow*-контроллеры chart.js (см. 06).
- `shared/ServerStatusWrapper.vue` — обёртка «сервер недоступен», `Timecodes.vue`, `bloomColors.ts` — палитра свечения карточек.

## Натиск (Onslaught / COMP7) — `pages/infographics/pages/onslaught/`

Два входа: внутри `/session` (свои фильтры) и публичный `/onslaught` (свой `Layout.vue`).

- `general/General.vue` — общая страница раздела с выбором региона и сезона; `rankDistribution/` — столбчатое распределение игроков по рангам и рейтингу.
- `statistics/Onslaught.vue` — личная статистика сезона: `mainStat/` (рейтинг, дельта, винрейт, топ-рейтинг — карточки с тултипами), `secondaryStat/` (текущий рейтинг-бар, квалификация), `dayChart/` (бар-чарт по дням, выбор дня), `battleHistoryTable/`, `vehicleTable/`, `mapsTable/`, `sortableTable/SortableTable.vue` — общий сортируемый стол, `tips/` — подсказки по горячим клавишам. Логика — в композаблах `useMainStat.ts`, `useBattleHistory.ts` и т.п.
- `leaderboard/Leaderboard.vue` — таблица лидеров с реалтайм-обновлением (`components/Live.vue`), пагинацией (`PageSelector`), деталкой игрока (`detail/Detail.vue` + графики `Charts.ts` на UniversalChart c зумом, выбор интервала `intervalSelector/`). Поиск по нику (`NicknameInput` в Settings): карточка найденного игрока над таблицей (строка + Detail + кнопка «Перейти к таблице» со скроллом к подсвеченной строке).
- `shared/useSeasonInterval.ts` — границы сезонов; `shared/settings/` — настройки, ввод ника (`NicknameInput`).
- Реалтайм-каналы `comp7Info`, `comp7LastRecalculation`, `battleResult` — см. 08.

## Реплеи — `pages/replays/`
- `search/Index.vue` — поиск/список реплеев (данные с бэкенда реплеев).
- `localAnalyzer/Index.vue` — локальный анализ файла реплея в браузере.
- `my/Index.vue` — реплеи игрока.
- `shared/Battle.vue`, `BattleStatValue.vue` — карточка боя.

## Сервисы — `pages/services/`
- `bob25/` — дашборд ивента «Битва Блогеров 2025»: командные тоталы (`store.ts` — модульный стор с запросами, `queryLoader.ts`), кросс-таблица встреч, топы по урону/танкам, таймсерии (`TimeSeriesChart.vue`), навыки блогеров, реклама/установка мода. Много компонентов, всё завязано на таблицы ивента BOB.
- `damageDistribution/` — расчёт распределения разового урона орудия: `Content.vue` (используется и в `/session/distribution`), веб-воркер `calcWorker.ts` (симуляция), `errorCalculation.ts`, описание в `description.md`.
- `mt36.1/` — сравнение изменений техники в патче 36.1 (`CompareCard.vue`, `LevelSwitcher.vue`).
- `fixedMatchDetect/` — детектор договорных боёв.

## Установщик модов — `pages/install/` (маршрут `/install`)

Устанавливает моды прямо в папку игры через **File System Access API** (только Chromium).

- `utils/installer.ts` — ядро: выбор папки игры (`showDirectoryPicker`), хэндл хранится в IndexedDB (`idb-keyval`), определение игры/региона и версии, парсинг имён `*.wotmod|*.mtmod`, копирование файлов, сравнение версий (`dotSeparatedCompare`).
- `utils/downloader.ts` — скачивание модов с `INSTALL_URL`.
- `mods/mods.ts` — реестр модов: обязательный `wotstat.analytics`, `wotstat.positions`, `wotstat.widgets` + списки `lestaMods`/`wgMods` (разные для Lesta и WG) с зависимостями `required`. Описания модов — markdown в `mods/details/ru/*.md`, i18n — `mods/i18n.json`.
- `components/` — карточки модов с 3D-наклоном (`modCard/useCardRotation.ts`), экспорт архива вместо установки (`exportArchive/` через jszip), конфетти по завершении.

## Виджеты — `pages/widgets/` (маршруты `/widgets/:widget*`, `/session/widgets/:widget*`)

Каталог OBS-виджетов. Сами виджеты живут на `widgets.wotstat.info`; страница встраивает их в iframe и общается через `postMessage` (`components/useIframeMessages.ts`, авторазмер — `useIframeContentBounding.ts`). Инструкции — markdown (`instructionGame/`, `instructionOBS/`), аккордеон `According.vue`.

## Общие для страниц — `pages/shared/`
- `header/` — шапка сайта; `useAdditionalHeaderHeight.ts` экспортирует реактивную `headerHeight` (используется в App.vue как CSS-переменная).
- `sidebarLayout/` — лейаут с сайдбаром; `QueryPreserveRouterLink.vue` — RouterLink, сохраняющий query-параметры при навигации (важно: фильтры живут в query).
- `problems/` — баннеры инцидентов (блокировка Hetzner и т.п.), включаются точечно.
