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

`session/vehicles` читает показатели из `PlayerBattleResults`: результаты участников после дедупликации событий и `ARRAY JOIN`, без агрегатных состояний. Таблица, история и сравнение используют общий построитель `vehicleStatisticsQuery.ts`; старые `VehiclesStatistics` и `VehiclesStatisticsByBattleMode` сохранены в БД для сравнения. Для основной таблицы последние даты берутся из `PlayerBattleLatestDays`: `max(lastDay)` отдельно для каждого танка или категории с теми же фильтрами, что и у фактов. Поиск последних дат не читает всю историю результатов. Графики и сравнение продолжают читать историю непосредственно из `PlayerBattleResults`.

`vehicleStatisticsQueries` строит два отдельных SQL-запроса основной таблицы. Опорный `actualDay` — наиболее частый `latestDay` среди групп в диапазоне `max(latestDay) - 2 .. max(latestDay)` включительно; при равной частоте выбирается более поздняя дата. Актуальны группы с `latestDay >= actualDay`, остальные неактуальны. Обе части читают индивидуальные 1/7/30-дневные окна через набор `(ключ группы, day)`. Для актуальных дополнительно задан общий диапазон `actualDay - (days - 1) .. max(latestDay)`, для неактуальных — от их минимальной последней даты минус `days - 1` до максимальной. Явные границы позволяют отсекать партиции независимо. Каждая группа принадлежит одному запросу, поэтому на клиенте объединяются готовые строки без повторного усреднения или слияния квантилей. Поле ответа `isActual` управляет подписью даты в UI; фронт не вычисляет актуальность повторно по загруженным строкам. Выведенные танки и режимы сохраняют свой последний доступный период.

`vehicleListTable/useVehicleTableStatistics.ts` сначала полностью получает актуальные строки, затем при необходимости — неактуальные. Для списка танков второй запрос выключен галочкой «Только актуальные»; категории всегда загружаются полностью. До завершения всей последовательности таблица показывает общий спиннер, частичные данные не публикуются. Смена SQL, галочки или уход со страницы отменяет текущую загрузку. Успешные ответы кешируются раздельно по SQL на время жизни страницы; отменённые запросы не переиспользуются. Серверный кеш сохраняется для каждого запроса.

`PlayerBattleLatestDays` — ежедневный срез по полному ключу фильтров; его заменяет `player_battle_latest_days_rmv` (`REFRESH EVERY 1 DAY OFFSET 10 MINUTE`, только завершённые UTC-дни). Срез предназначен для текущей таблицы, не для восстановления последних дат на произвольную дату в прошлом. Пользователю `public` нужно право `SELECT` на обе таблицы; выдаёт его владелец БД вручную.

Базовые и производные показатели загружаются вместе, дополнительные агрегации — по выбору. Кеш вкладки и серверный кеш на сутки используют явную UTC-дату в SQL; `query_cache_nondeterministic_function_handling = 'save'` разрешает кешировать `any` и TDigest ([документация ClickHouse](https://clickhouse.com/docs/operations/query-cache)).

[SQL создания и заполнения PlayerBattleResults](../.local/sql/player-battle-results.md) лежит рядом с существующим `.local/sql/client.xml`; каталог `.local` не хранится в Git. SQL выполняет пользователь вручную. Историческое заполнение проверено до сентября 2026 включительно; автоматическое поступление новых результатов и агрегации метрик через MV — отдельный следующий этап.

Подготовлен, но ещё не применён [эксперимент с дневным срезом `VehiclesStatisticsRecent`](../.local/sql/vehicles-statistics-recent.md): 30 календарных дней относительно последнего дня каждой полной комбинации фильтров, все используемые агрегаты без дисперсий и две агрегирующие проекции (`by_mode`, `by_mode_squad`). Запрос заново выбирает общий последний день танка/категории после фильтрации и объединяет состояния только за нужные 1/7/30 дней. Refreshable MV полностью заменяет срез; подготовлены отдельные SQL создания, ручного пересчёта, сравнения значений и измерений с проекциями/без. Фронт на экспериментальную таблицу пока не переключён; ускорение проекциями ещё не измерено.

Коротко: данные приходят от игрового мода в таблицы `Event_*` (сортировка по игроку, партиции по месяцу) и от микросервиса-cron в справочники (техника/карты/предметы по версиям + опрос игрового API: лидерборды Натиска, MoE, онлайн и пр.). Прочие базы (`MT-36-1`, `BOB25`, `Positions`, `WOTINSPECTOR`) — изолированные легаси, фронтом не используются.

Утилиты дат: `dateToDbIndex(date)` (ms→id-строка ×1e10), `dbIndexToDate`, `dateToDbDate` (YYYY-MM-DD), `semverCompareStartFrom('1.2.3')` — фильтр по `modVersionComparable`.

## Правила

- Значения в SQL интерполируются строками — не вставляй непроверенный пользовательский ввод без экранирования (существующий код экранирует минимально; ники приходят из URL).
- Не выводи колонки из `RESTRICTED_COLUMNS` (`systemInfo.*`).
- Для новых запросов выбирай cache settings по образцу соседних (частообновляемое → короткий TTL).
