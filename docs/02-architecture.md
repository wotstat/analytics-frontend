# Архитектура и структура кода

## Точка входа

- `index.html` → `src/main.ts`: импорт глобальных стилей `styles/index.scss`, создание приложения, роутер, Яндекс.Метрика (`shared/external/ym/metrika.ts`).
- `src/App.vue`: каркас — `Header` + `HeaderSpacer` + `RouterView`, плюс корневые слои `BackgroundRoot`, `FocusEffectRoot` и `ContextMenuRoot`. Через route meta `clearPage` страница может рендериться без каркаса, `hideHeader` — без шапки. CSS-переменные `--bold-weight` подстраиваются под Windows (700 вместо 800).

## Отдельный target Open Graph

Определения и компоненты карточек находятся в обычном `src/`
рядом с соответствующими страницами. Имя `.ts`-файла определения произвольное;
Vite-плагин `vitePlugins/metaDefinitions/metaDefinitions.ts` находит экспортированные вызовы
`defineMetaDefinition` через TypeScript AST и собирает `virtual:meta-definitions`.
Общий дизайн карточек, default-карточка с определением
и общие контексты сайта находятся в `src/shared/ui/meta/`.
В `src/meta/` остаётся общий механизм Open Graph, разделённый по назначению:
`utils.ts` — типы, размеры и чистые хелперы; `resolver.ts` — каталог определений и вычисление метаданных;
`cards/` — `CardSurface` и протокол асинхронной готовности `useMetaReady`;
`renderer/` — приложение для Chromium. Студия — асинхронная страница основного SPA по `/meta`
(`pages/metaStudio/`), без iframe. Команды и зависимости общие с frontend.

`src/meta/renderer/index.html` → `src/meta/renderer/main.ts` → `App.vue` — отдельное минимальное
приложение для backend с внешним `prepare`, без собственного Vue Router.
В `main.ts` — монтирование App, в `App.vue` — полотно, состояние задания,
обработка ошибок карточки и ожидание готовности.
`App` регистрирует `window.prepare` в `onMounted`, а в `onUnmounted` удаляет его
и отменяет незавершённую подготовку. На вкладке «Карточка» студия встраивает этот же
компонент с `embedded`: ограниченное полотно без изменения маршрута, прокрутки
и глобальных стилей студии. Вызовы `prepare` и их длительность видны в журнале.
Resolver выбирает определение по URL, а `CardSurface` — компонент по готовому `meta.definitionId`.
`App` напрямую рендерит `CardSurface`;
логика `prepare` одинакова в студии и backend, `embedded` меняет только оформление.
Backend вызывает `window.prepare({ url, format, meta })` с уже рассчитанными метаданными
и дожидается Promise перед скриншотом. `meta` обязательна: renderer не создаёт
resolver и не загружает контексты. В студии метаданные
вычисляются перед передачей в `RenderPreview`.
Для асинхронной подготовки карточка вызывает `useMetaReady` в setup: callback запускается
после mount, получает `AbortSignal`, а App ждёт его завершения через `CardSurface`.
Без хука карточка считается синхронной. Debug-карточка `debug-delayed` в студии проверяет задержку 5 секунд.
Приложение не импортирует основной App, роутер сайта или студию. Команда `build` в `package.json`
после основного SPA собирает браузерный renderer и серверный модуль метаданных через корневой
`vite.config.ts` с целями `BUILD_TARGET=meta-renderer` и `BUILD_TARGET=meta-server`.
Файл может содержать `export default defineMetaDefinition({ ... })` и несколько
именованных `export const … = defineMetaDefinition({ ... })`.
В dev изменения, добавление, удаление и переименование таких файлов автоматически
пересобирают каталог при следующей загрузке и перезагружают страницу.
`CardSurface` использует общий каталог определений из `resolver.ts` и выбирает компонент
по `meta.definitionId`. Объявления контекстов могут входить в renderer-бандл, но их загрузка
начинается только при создании resolver; renderer его не создаёт и получает готовую `meta`.
Компоненты подключаются обычными импортами,
без ограничения на имена файлов. `meta/resolver.ts` напрямую собирается
в `server.mjs` для Bun, без отдельной точки входа с реэкспортами.
Настройка Vite `build.ssr` выбирает сборку серверного JS-модуля; Vue-страницы на сервере не рендерятся.
Только в этой сборке содержимое `.vue` заменяется пустым объектом, поэтому код
карточек, Vue и их браузерные зависимости в Bun не попадают.

Определения могут объявлять `contexts`. Общие объявления сайта находятся в `shared/ui/meta/contexts/`,
механизм прогрева и обновления — в `meta/context/`. `createMetaResolver(query)`
запускает одну загрузку на уникальный id и передаёт снимки в синхронный `meta(url, context)`.
HTTP ждёт только зависимости выбранного определения в пределах первоначального
`initialWaitMs`; обновления сохраняют последнее успешное значение. Загрузчики и клиент
запросов также входят в `server.mjs` и не зависят от браузерного состояния.
Общий клиент и выполнение `query` находятся в `db/client.ts`; браузерные Vue-хелперы
и статистика остаются в `db/index.ts`. Студия передаёт существующий браузерный `query`.
Bun при старте вызывает экспортированные из артефакта `createDatabase(database)`
и `createMetaResolver(query)`. Для студии и debug-страниц `getBrowserMetaResolver()`
лениво создаёт один resolver; `shallowRef` уведомляет их об обновлении контекстов.

Выбирается определение с наибольшим `priority`; default — обычное правило `*`
с приоритетом -1000. Компонент изображения необязателен, поэтому определение может
содержать только title. Стили компонентов — scoped SCSS с вложенностью;
reset документа renderer — в блоке `<style lang="scss">` без `scoped` в `src/meta/renderer/App.vue`.
Сборка, контракт и правила обновления описаны в [11-open-graph.md](11-open-graph.md).

## Роутинг (`src/routes.ts`)

Все маршруты в одном файле. Тяжёлые страницы — через `asyncPage()` из `pages/shared/asyncPage.ts`
(обёртка `defineAsyncComponent` с `PageLoader` и `suspensible: true`). Обёртка сообщает
о фактическом mount/activation загруженной страницы в `shared/uiKit/pageNavigation/`.
`setupPageNavigation` объединяет этот сигнал с готовностью queryStorage и предоставляет
read-only `readyRoute`: во время перехода он равен `null`, после монтирования всех
асинхронных route records и синхронизации параметров содержит текущий маршрут.
Мета наблюдает этот сигнал, не вызывая загрузчики страниц или flush history. Карта маршрутов:

| Путь | Компонент | Что это |
| --- | --- | --- |
| `/` | `pages/Main.vue` | Главная-лендинг |
| `/session` + дети | `pages/infographics/Index.vue` | Личная сессионная статистика (лейаут с сайдбаром и фильтрами). Дети: `''`→Battle, `shots`, `damage`, `results`, `maps`, `players`(Coverage), `chuck-norris-tournament`, `lootbox`, `onslaught`, `onslaught-leaderboard`, `widgets/:widget*` |
| `/onslaught` + дети | `onslaught/Layout.vue` | Публичная статистика Натиска: `general`, `leaderboard`, `personal` |
| `/replays` + дети | `pages/replays/Index.vue` | Реплеи: поиск (``), локальный анализатор (`analyze`), мои (`my`) |
| `/bb25` | `services/bob25` | «Битва Блогеров 2025» — ивент-дашборд |
| `/mt-36-1` | `services/mt36.1` | Сравнение техники патча МТ 36.1 |
| `/services/fixed-match-detector` | `services/fixedMatchDetect` | Детектор договорных боёв |
| `/install` | `pages/install/Index.vue` | Установщик модов (File System Access API) |
| `/widgets/:widget*` | `pages/widgets/Index.vue` | Каталог/просмотр OBS-виджетов (iframe на widgets.wotstat.info) |
| `/meta` + `/meta/cards/:id` | `pages/metaStudio/` | Студия карточек и текстовых метаданных (async) |
| `/meta/backgrounds` | `pages/metaStudio/backgrounds/Backgrounds.vue` | Сравнение вариантов фона на двух типах карточек |
| `/debug` + дети | `pages/debug/Debug.vue` | Песочница технических фичей — см. ниже |

Route meta, используемые лейаутом `/session`: `hideTankList`, `customTitle`, глобальные `clearPage`, `hideHeader`. Общими фильтрами владеют страницы и видимые элементы настройки; layout не подключает хранилище параметров.

`scrollBehavior`: скролл вверх только при смене корневого matched-маршрута.

`shared/uiKit/queryStorage/utils/createDeferredWebHistory.ts` реализует `RouterHistory` с отложенной
записью в browser history. Маршрут и компоненты переключаются сразу; после обновления
Vue подключённый через `setupQueryStorage(router, history)` координатор синхронно
пересчитывает query. History ждёт применения query роутером и записывает итоговый адрес.
Уточняющий `replace` объединяется с ожидающим `push`, самостоятельные `push` сохраняются.
Загрузку async-страниц этот механизм не ждёт; сохраняется обычное поведение `PageLoader`.

## Песочница `/debug`

Страница-стенд для технических фичей: по подстранице на компонент, внутри — секции с вариантами применения, которые можно потыкать руками. Открыта по прямой ссылке (никакой авторизации), но ссылок с сайта нет, `Disallow: /debug` в `robots.txt` и `<meta name="robots" content="noindex">` на время пребывания на странице (`shared/useNoIndex.ts`). Сюда же ходят, когда надо воспроизвести баг в изоляции от боевой страницы.

- **`pages/debug/routes.ts`** — единственный источник правды: массив записей `{ path, title, description, group, component }`, из которого выводятся и роуты, и навигация, и индекс. **Новая страница добавляется одной записью.** Компоненты только через `import()`, поэтому в главный бандл попадают лишь пути.
- Страница `/debug/meta` в «UI-компонентах» содержит только заголовок и переход в Meta Studio (`/meta`), без отдельной категории и страниц превью. Тестовые карточки и определения остаются в `pages/debug/pages/meta/cards/` и доступны в студии: `debug-delayed` проверяет готовность через 5 секунд, `debug-vehicle` — загрузку названия танка.
- Раздел «Графики» содержит стенды ядра `shared/uiKit/chart`. Проектные UI-компоненты относятся к «UI-компонентам», включая таблицу данных на `/debug/composable-table` (независимые примеры колонок, сортировки, слотов, раскрытия и состояний без импорта страниц сайта), палитру и renderer рядов tooltip на `/debug/series-tooltip`, toolbar на `/debug/chart-toolbar`, временной график на `/debug/time-series` и готовую панель на `/debug/time-series-panel`.
- **`pages/debug/Debug.vue`** — лейаут: шапка сайта остаётся, под ней не-sticky блок чипсов-ссылок (sticky ломал бы проверки скролла, флипа поповеров и позиционирования тултипов), ниже `RouterView`.
- **`pages/debug/shared/`** — служебная обвязка, общая для всех подстраниц: `DebugPage.vue` (заголовок + описание + путь к источнику), `DebugSection.vue` (секция с якорем и строкой «на что смотреть»), `debug.scss` (не-scoped, всё внутри `.debug-root`: классы контролов, сцен `.debug-stage` с модификаторами, лога событий, таблицы состояний), `fixtures/` (синтетика с сидом и реальные запросы **в одной форме данных**, чтобы переключатель источника стоил пары строк), `useNoIndex.ts`. Плюс переиспользуемая начинка секций: `EventLog.vue` + `useEventLog.ts` (лог событий; опции `max`, `time: 'clock' | 'relative'`, `collapseRepeats` — последняя схлопывает поток одинаковых записей вроде `hoverUpdate` в «текст ×N»), `useFrameStats.ts` (средний и худший кадр за окно ~500 мс), `PlacementSelect.vue`, `ViewportBox.vue`, `useStageViewportOffset.ts` (сцена как границы вьюпорта — чтобы флип поповера и тултипа воспроизводился посреди страницы).

Конвенции страниц: лог событий, кадровая статистика и хелперы позиционирования берутся **только из `shared/`** — не заводи свою копию в `pages/<фича>/shared/` (страницы делались независимо, и восемь копий `EventLog` уже пришлось сводить обратно); недостающее поведение добавляется опцией к общему модулю. Контролы — нативные `input`/`select`/`button` на классах из `debug.scss`; у каждой секции есть описание «что должно произойти» и путь к файлу-источнику; тач-специфика подписывается словами в `.debug-note`; ценнее всего тумблеры, которые **ломают компонент нарочно** (снос цели из DOM, вырожденные bounds, забытый `dataDidUpdate`) — именно они показывают границы поведения. Поповеры и меню телепортируются в `#popover-root`, тултипы директив — в свой `#tooltip-root`, то есть наружу `.debug-root`, и классы `.debug-*` до их содержимого не достают.

## Структура `src/`

```
src/
├─ main.ts, App.vue, routes.ts
├─ db/            — клиент ClickHouse, query-хелперы, схема MV (см. 03)
├─ pages/         — страницы, сгруппированы по разделам сайта (см. 04)
│  ├─ debug/         — песочница технических фичей (см. ниже)
│  ├─ infographics/  — /session: лейаут, настройки, страницы, виджеты-карточки
│  ├─ install/       — установщик модов
│  ├─ replays/       — реплеи
│  ├─ services/      — отдельные сервисы (bob25, mt36.1, fixedMatchDetect)
│  ├─ widgets/       — каталог OBS-виджетов
│  └─ shared/        — общие для страниц: header, sidebarLayout, problems (банеры инцидентов)
├─ shared/        — переиспользуемый код
│  ├─ uiKit/      — переносимые компоненты и механизмы без проектных зависимостей, включая queryStorage (см. 05)
│  ├─ ui/         — UI сайта с проектными зависимостями (см. 05)
│  ├─ game/       — domain (данные и правила), components (отображение), encoding (короткие URL) (см. 07)
│  ├─ legacyStatQuery/ — адаптер совместимости общих фильтров инфографики, StatParams, WHERE и кеш (см. 03, 10)
│  ├─ i18n/       — локализация имён танков/карт из БД + мини-хелпер useI18n
│  ├─ external/   — URL поддоменов, realtime WS, метрика, wotInspector
│  ├─ composition/, utils/, global/ — хелперы
├─ styles/        — глобальный SCSS (variables, mixins, table, markdown...)
└─ assets/        — иконки, изображения
```

## Конвенции кода

- Браузерный `tsconfig.json` включает DOM и `types: []`; Bun-типы подключаются только
  в `tsconfig.node.json` для `vite.config.ts`. Явные ссылки из зависимостей обходят
  `types: []`, поэтому SVG-компоненты описаны локально в `src/vite-env.d.ts`.
  Для архивов модов используется `fflate`; патчи типов зависимостей не нужны.
- Алиас `@` → `/src` (vite.config + tsconfig).
- ESLint: **одинарные кавычки**, **без точек с запятой** (`semi: never`). Соблюдай при генерации кода.
- Компоненты: PascalCase `.vue`, композаблы `useXxx.ts`, попапки по фичам — компонент + рядом его `utils.ts`/`store.ts`/`i18n.json`.
- Состояние страницы кладут в **URL query** через `shared/uiKit/queryStorage/useQueryStorage` (общий реестр с sessionStorage, жизненным циклом владельцев и историей; см. [10-query-storage.md](10-query-storage.md)) и/или `useLocalStorage`. Ядро не зависит от фильтров и страниц. Новые страницы объявляют собственные параметры рядом со своим кодом. `shared/legacyStatQuery/` сохраняет общий набор фильтров инфографики и интерфейс `StatParams` для старых потребителей, включая SQL и выбор кеша. URL-кодек и SQL-условия режимов находятся в `shared/game/domain/battleModes/`, бинарные Writer/Reader — в `shared/utils/encoding/compactBinary.ts`. Конкретные бинарные форматы реализуются на страницах. Глобальных сторов нет; модульный синглтон-стейт — просто `ref` на уровне модуля (пример: `pages/services/bob25/store.ts`, `shared/global/globalPreferred.ts`).
- Многие страницы грузят данные лениво по видимости карточки: `useElementVisibility` + опция `enabled` у query-хелперов.
- Markdown-файлы импортируются как Vue-компоненты (`import { VueComponent } from './index.md'`).
- Комментарии и тексты интерфейса — по-русски. Сообщения в `new Error(...)` — по-английски.

## Паттерн старых страниц инфографики

Сохраняется через адаптер `shared/legacyStatQuery/` до переписывания этих страниц на собственные параметры `useQueryStorage`.

```ts
const params = useQueryStatParams()          // фильтры из URL
const settings = useQueryStatParamsCache(params) // clickhouse cache settings
const result = queryComputed<T>(() => `select ... from Event_OnBattleResult ${whereClause(params.value)}`, { settings })
// result.value = { status: loading|success|{status: error, reason}, data: T[] }
```

Отображение — карточки `GenericInfo`, `MiniBar` и специфичные для страниц SVG-виджеты со статусом загрузки (см. 04 и 06).
