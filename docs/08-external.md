# Внешние сервисы и интеграции (`src/shared/external/`)

## Поддомены wotstat — `externalUrl.ts`

Все внешние URL строятся от префикса окружения: если сайт открыт с `xxx.wotstat.info`, префикс `xxx.` добавляется ко всем поддоменам (так работают тестовые стенды); иначе берётся `VITE_DEFAULT_URL_PREFIX` (dev) или пусто (прод).

| Константа | URL | Назначение |
| --- | --- | --- |
| `CLICKHOUSE_WEB_PROXY_URL` | `https://<p>wotstat.info` (path `/api/db/`) | Прокси ClickHouse — весь слой данных |
| `CLICKHOUSE_URL` | `https://<p>db.wotstat.info` | Прямой адрес БД (упоминается в текстах про SQL-доступ) |
| `ANALYTICS_REALTIME_URL` | `https://<p>realtime.wotstat.info` | WebSocket-каналы реалтайма |
| `STATIC_URL` | `https://<p>static.wotstat.info` | Статика: картинки танков, миникарты и т.д. |
| `WIDGETS_URL` | `https://<p>widgets.wotstat.info` | OBS-виджеты (встраиваются в iframe) |
| `POSITIONS_URL` | `https://<p>positions.wotstat.info` | Сервис позиций |
| `INSTALL_URL` | `https://<p>install.wotstat.info` | Раздача файлов модов для установщика |
| `DISCORD_URL` | discord.gg/… | Сообщество |

Новые внешние адреса добавляй сюда же, с учётом префикса.

## Realtime — `realtime/useAnalyticsRealtime.ts`

Композабл поверх `useWebSocket` (VueUse): `useAnalyticsRealtime(channel)` подключается к каналу на `ANALYTICS_REALTIME_URL` и возвращает `{ data, hasData, status }` (shallow refs). Типизированные каналы (`ChannelsTypes`):

- `time`, `totalEvents` — числовые счётчики (главная страница);
- `battleResult` — поток завершённых боёв `{id, battleMode, playerName, region}`;
- `comp7Info` — рейтинг игроков Натиска в реальном времени;
- `comp7LastRecalculation` — время последнего пересчёта лидерборда.

Канал может иметь query-часть (`channel?param=`), процессоры парсят число или JSON.

## Яндекс.Метрика — `ym/metrika.ts`

`setup()` вызывается в `main.ts` (webvisor/clickmap выключены). Типы — `@types/yandex-metrika-tag`. События целей отправляются точечно из кода.

## WoT Inspector — `wotInspector/wotInspector.ts`

Построение ссылок на 3D-просмотр танков/сравнение в tanks.gg-подобном сервисе WoT Inspector.

## Установщик модов (детали в [04-pages.md](04-pages.md))

- Файлы модов скачиваются с `INSTALL_URL` (`pages/install/utils/downloader.ts`).
- Запись в папку игры — File System Access API (`showDirectoryPicker`, типы `@types/wicg-file-system-access`); хэндл папки сохраняется в IndexedDB через `idb-keyval` и переиспользуется между визитами.
- Если API недоступен (не Chromium) — фолбэк: сборка zip-архива в браузере (`jszip`, `exportArchive/`).

## Виджеты (iframe)

Страница `/widgets` встраивает виджеты с `WIDGETS_URL` в iframe и общается через `window.postMessage`:
- `useIframeMessages.ts` — приём сообщений от iframe (фильтрация по `event.source`);
- `useIframeContentBounding.ts` — авторазмер iframe под содержимое.

## Прочее

- `robots.txt`, `sitemap.xml`, `sitemap-google.xml` — в `public/`.
- Реплеи и позиции — отдельные бэкенды экосистемы; их API вызываются из соответствующих страниц (`pages/replays/`), смотри код страницы перед изменением.
