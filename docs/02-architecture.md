# Архитектура и структура кода

## Точка входа

- `index.html` → `src/main.ts`: импорт глобальных стилей `styles/index.scss`, регистрация chart.js-компонентов и глобальных дефолтов (белый текст, шрифт Inter, анимация 400мс), создание приложения, роутер, Яндекс.Метрика (`shared/external/ym/metrika.ts`).
- `src/App.vue`: каркас — `Header` + `HeaderSpacer` + `RouterView`, плюс корневые слои `FocusEffectRoot` и `ContextMenuRoot`. Через route meta `clearPage` страница может рендериться без каркаса, `hideHeader` — без шапки. CSS-переменные `--bold-weight` подстраиваются под Windows (700 вместо 800).

## Роутинг (`src/routes.ts`)

Все маршруты в одном файле. Тяжёлые страницы — через `asyncPage()` (обёртка `defineAsyncComponent` с `PageLoader` и `suspensible: true`). Карта маршрутов:

| Путь | Компонент | Что это |
| --- | --- | --- |
| `/` | `pages/Main.vue` | Главная-лендинг |
| `/session` + дети | `pages/infographics/Index.vue` | Личная сессионная статистика (лейаут с сайдбаром и фильтрами). Дети: `''`→Battle, `shots`, `damage`, `results`, `maps`, `players`(Coverage), `chuck-norris-tournament`, `distribution`, `lootbox`, `onslaught`, `onslaught-leaderboard`, `widgets/:widget*` |
| `/onslaught` + дети | `onslaught/Layout.vue` | Публичная статистика Натиска: `general`, `leaderboard`, `personal` |
| `/replays` + дети | `pages/replays/Index.vue` | Реплеи: поиск (``), локальный анализатор (`analyze`), мои (`my`) |
| `/bb25` | `services/bob25` | «Битва Блогеров 2025» — ивент-дашборд |
| `/mt-36-1` | `services/mt36.1` | Сравнение техники патча МТ 36.1 |
| `/services/fixed-match-detector` | `services/fixedMatchDetect` | Детектор договорных боёв |
| `/install` | `pages/install/Index.vue` | Установщик модов (File System Access API) |
| `/widgets/:widget*` | `pages/widgets/Index.vue` | Каталог/просмотр OBS-виджетов (iframe на widgets.wotstat.info) |
| `/damage` | `services/damageDistribution/Index.vue` | Публичная страница распределения урона |

Route meta, используемые лейаутом `/session`: `hideTankList`, `customTitle`, `preventRemountOnStatChange`, глобальные `clearPage`, `hideHeader`.

`scrollBehavior`: скролл вверх только при смене корневого matched-маршрута.

## Структура `src/`

```
src/
├─ main.ts, App.vue, routes.ts
├─ db/            — клиент ClickHouse, query-хелперы, схема MV (см. 03)
├─ pages/         — страницы, сгруппированы по разделам сайта (см. 04)
│  ├─ infographics/  — /session: лейаут, настройки, страницы, виджеты-карточки
│  ├─ install/       — установщик модов
│  ├─ replays/       — реплеи
│  ├─ services/      — отдельные сервисы (bob25, damageDistribution, mt36.1, fixedMatchDetect)
│  ├─ widgets/       — каталог OBS-виджетов
│  └─ shared/        — общие для страниц: header, sidebarLayout, problems (банеры инцидентов)
├─ shared/        — переиспользуемый код
│  ├─ ui/         — старые/простые UI-компоненты (Tooltip, ModalWindow, лоадеры, tween)
│  ├─ uiKit/      — новый UI-кит (tableView, popover, contextMenu, chart, focusEffect...)
│  ├─ game/       — игровой домен: режимы, танки, арены, селекторы (см. 07)
│  ├─ query/      — StatParams из URL + генерация WHERE (см. 03)
│  ├─ i18n/       — локализация имён танков/карт из БД + мини-хелпер useI18n
│  ├─ external/   — URL поддоменов, realtime WS, метрика, wotInspector
│  ├─ composition/, utils/, global/ — хелперы
├─ composition/   — useTweenRef (дубль-вариант tween)
├─ styles/        — глобальный SCSS (variables, mixins, table, markdown...)
└─ assets/        — иконки, изображения
```

## Конвенции кода

- Алиас `@` → `/src` (vite.config + tsconfig).
- ESLint: **одинарные кавычки**, **без точек с запятой** (`semi: never`). Соблюдай при генерации кода.
- Компоненты: PascalCase `.vue`, композаблы `useXxx.ts`, попапки по фичам — компонент + рядом его `utils.ts`/`store.ts`/`i18n.json`.
- Состояние страницы кладут в **URL query** (см. `useQueryStatParams`, `useQueryParamStorage`) и/или `useLocalStorage`. Глобальных сторов нет; модульный синглтон-стейт — просто `ref` на уровне модуля (пример: `pages/services/bob25/store.ts`, `shared/global/globalPreferred.ts`).
- Многие страницы грузят данные лениво по видимости карточки: `useElementVisibility` + опция `enabled` у query-хелперов.
- Markdown-файлы импортируются как Vue-компоненты (`import { VueComponent } from './index.md'`).
- Комментарии и тексты — по-русски.

## Типичный паттерн страницы-«инфографики»

```ts
const params = useQueryStatParams()          // фильтры из URL
const settings = useQueryStatParamsCache(params) // clickhouse cache settings
const result = queryComputed<T>(() => `select ... from Event_OnBattleResult ${whereClause(params.value)}`, { settings })
// result.value = { status: loading|success|{status: error, reason}, data: T[] }
```

Отображение — карточки `GenericInfo` / `MiniBar` / `MiniPie` со статусом загрузки (см. 04 и 06).
