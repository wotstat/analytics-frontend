# Слой данных: ClickHouse

Фронтенд ходит **напрямую в ClickHouse** через web-прокси. Это центральный механизм всего сайта.

## Клиент (`src/db/index.ts`)

```ts
export const clickhouse = createClient({
  url: CLICKHOUSE_WEB_PROXY_URL,   // https://<prefix>wotstat.info
  pathname: '/api/db/',
  username: 'public',
  database: 'WOT',
  ...
})
```

- Пользователь `public` — только чтение. CORS-заголовок включён настройкой `add_http_cors_header`.
- Счётчики статистики использования (`totalRequests`, `totalElapsed`, `totalRowsRead`, `totalBytesRead`) — в localStorage, показываются в футере/настройках.

## Статусы запроса

```ts
export const loading / success / error  // символы
export type Status = loading | success | { status: error, reason: string }
mergeStatuses(...statuses)  // error > loading > success
isErrorStatus(status)
```

Компоненты-виджеты принимают `status: Status` и сами показывают лоадер/ошибку.

## Query-хелперы (все в `src/db/index.ts`)

| Функция | Что делает |
| --- | --- |
| `query<T>(sql, {allowCache, settings, abortSignal})` | Низкоуровневый запрос, формат JSON. **Дедупликация**: одинаковый SQL в полёте возвращает тот же Promise; результат кешируется в `Map` на время жизни вкладки (при `allowCache`) |
| `queryComputed<T>(() => sql \| null, {settings, enabled, allowCache})` | Реактивный: пересчитывается при смене SQL или `enabled`; отменяет предыдущий через AbortController. Возвращает `ShallowRef<{status, data: T[]}>`. `null` из геттера = не выполнять |
| `queryComputedFirst<T>(..., defaultValue)` | То же, но `data` — первая строка либо дефолт |
| `queryAsync<T>(sql, {enabled, ...})` | Одноразовый запрос, ждёт `enabled === true` и выполняется один раз |
| `queryAsyncFirst<T>(sql, defaultValue, ...)` | Одноразовый + первая строка |

`enabled` часто связывают с `useElementVisibility(cardRef)` — данные грузятся, когда карточка попала во вьюпорт.

## Кеш на стороне ClickHouse

Константы настроек `use_query_cache` с TTL: `SUPER_SHORT_CACHE_SETTINGS` (5с), `SHORT_CACHE_SETTINGS` (10с), `CACHE_SETTINGS` (60с), `MEDIUM_CACHE_SETTINGS` (5мин), `LONG_CACHE_SETTINGS` (10мин).

Выбор кеша по фильтрам — `getQueryStatParamsCache(params)` / `useQueryStatParamsCache(params)` (`src/shared/query/useQueryStatParams.ts`): для конкретного игрока кеша нет, для «за всё время» — MEDIUM, для «последние X боёв» — SHORT, иначе CACHE.

## StatParams и генерация WHERE (`src/shared/query/useQueryStatParams.ts`)

`useQueryStatParams()` парсит query-параметры URL в объект:

```ts
type StatParams = {
  player: string | null        // ?nickname=
  level: TankLevel[] | null    // ?level=8,10   (1..11)
  types: TankType[] | null     // ?type=HT,MT   (LT|MT|HT|AT|SPG)
  tanks: string[] | null       // ?tank=ussr:R45_IS-7,...
  battleMode: keyof customBattleModes | 'any'  // ?mode=
  period: 'allTime' | {type:'lastX',count} | {type:'fromTo',from,to} | {type:'fromToNow',from}
          // ?lastX= | ?from=&to= | ?from=
  battleId: string[] | null    // ?battleId= (приоритетнее периода)
}
```

`whereClause(params, {withWhere, isBattleStart, ignore, additional})` — собирает SQL `where ...`:
- фильтры по игроку/уровню/типу/танку/режиму;
- период через `id` (id = `timestamp_ms * 1e10`, см. `dateToDbIndex`) и `dateTime`;
- `lastX` — подзапрос последних N `Event_OnBattleStart.id`;
- `isBattleStart: true` — фильтр по `id`, иначе по `onBattleStartId` (события, привязанные к бою).

`whereClauseColumns(params)` — список колонок, участвующих в фильтре; нужен для выбора materialized view.

## Materialized Views (`src/db/schema.ts`)

Для тяжёлых агрегаций есть семейства MV с разными наборами колонок-ключей (`player_coverage_*`, `team_results_mv`, `accuracy_hit_points_*`, `Event_OnShot_*`). Выбор оптимального:

```ts
bestMV('player_coverage', paramsOrColumns) // → имя MV, покрывающее все колонки фильтра, или null
bestMVOrder(target, mvName)                // → колонки этого MV
```

Если `bestMV` вернул null — фильтры несовместимы с MV, нужно запрашивать сырые таблицы событий.

## Таблицы БД

Полный каталог таблиц базы `WOT` с колонками, типами и значениями категориальных полей (режимы, типы/роли танков, нации, снаряды, карты и т.п.) вынесен в отдельный справочник — [09-database-schema.md](09-database-schema.md).

Коротко: данные приходят от игрового мода в таблицы `Event_*` (сортировка по игроку, партиции по месяцу) и от микросервиса-cron в справочники (техника/карты/предметы по версиям + опрос игрового API: лидерборды Натиска, MoE, онлайн и пр.). Прочие базы (`MT-36-1`, `BOB25`, `Positions`, `WOTINSPECTOR`) — изолированные легаси, фронтом не используются.

Утилиты дат: `dateToDbIndex(date)` (ms→id-строка ×1e10), `dbIndexToDate`, `dateToDbDate` (YYYY-MM-DD), `semverCompareStartFrom('1.2.3')` — фильтр по `modVersionComparable`.

## Правила

- Значения в SQL интерполируются строками — не вставляй непроверенный пользовательский ввод без экранирования (существующий код экранирует минимально; ники приходят из URL).
- Не выводи колонки из `RESTRICTED_COLUMNS` (`systemInfo.*`).
- Для новых запросов выбирай cache settings по образцу соседних (частообновляемое → короткий TTL).
