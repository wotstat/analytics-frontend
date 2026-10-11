# wotstat analytics-frontend

Фронтенд сайта **wotstat.info** — аналитика для «Мира танков» / World of Tanks.
SPA: Vue 3 (`<script setup>` + TS) + Vite, пакетный менеджер — Bun. Данные — напрямую из ClickHouse.

```bash
bun run dev      # dev-сервер
bun run build    # тесты + vue-tsc + vite build — останавливается при ошибке любого этапа
bun run test     # совместимость бинарных ссылок compare (Bun)
```

Стиль кода: одинарные кавычки, без точек с запятой (ESLint), тексты UI по-русски.

Перед написанием или изменением кода прочитай [docs/code-mistakes.md](docs/code-mistakes.md) — пополняемый список ошибок, которые не нужно повторять. Новые замечания пользователя к написанию кода добавляй туда или уточняй существующее правило.

Не добавляй accessibility-атрибуты (`aria-*`, `role`, `tabindex`), нативные `title` и специальную логику доступности, focus стили без явного запроса пользователя.

## Проверка изменений

Без явного запроса пользователя **не добавляй новые юнит-тесты и инфраструктуру для них**. Проверяй изменения через `bun run build`, ESLint и при необходимости вручную в браузере или на `/debug`.

По запросу пользователя добавлен тест совместимости бинарных ссылок `compare`: `src/pages/infographics/pages/vehicles/timeSeriesCompare/query/codec/codec.test.js`. Запуск — `bun run test`. При изменении кодека, компактеров, словарей или палитры запускай его. Фиксированные ссылки и ожидаемые JSON в `codec.fixtures.json` защищают формат сохраняемых ссылок: не перегенерируй их автоматически при падении теста.

## Документация

Подробная документация — в [docs/](docs/README.md). Начни с индекса и читай только релевантные задаче разделы:

- [docs/01-overview.md](docs/01-overview.md) — стек, команды, env, деплой
- [docs/02-architecture.md](docs/02-architecture.md) — структура, роутинг, конвенции
- [docs/03-data-clickhouse.md](docs/03-data-clickhouse.md) — запросы, кеши, StatParams/whereClause
- [docs/04-pages.md](docs/04-pages.md) — разделы сайта
- [docs/05-ui-kit.md](docs/05-ui-kit.md) — UI-компоненты и стили
- [docs/06-charts.md](docs/06-charts.md) — графики на UniversalChart
- [docs/07-game-domain.md](docs/07-game-domain.md) — игровой домен, локализация
- [docs/08-external.md](docs/08-external.md) — поддомены, realtime, интеграции
- [docs/09-database-schema.md](docs/09-database-schema.md) — справочник схемы БД WOT: таблицы, колонки, типы, категории

При значимых изменениях архитектуры обновляй соответствующий раздел docs.
