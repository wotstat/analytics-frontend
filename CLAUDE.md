# wotstat analytics-frontend

Фронтенд сайта **wotstat.info** — аналитика для «Мира танков» / World of Tanks.
SPA: Vue 3 (`<script setup>` + TS) + Vite, пакетный менеджер — Bun. Данные — напрямую из ClickHouse. Тестов нет.

```bash
bun run dev      # dev-сервер
bun run build    # vue-tsc + vite build — основная проверка корректности
```

Стиль кода: одинарные кавычки, без точек с запятой (ESLint), тексты UI по-русски.

## Документация

Подробная документация — в [docs/](docs/README.md). Начни с индекса и читай только релевантные задаче разделы:

- [docs/01-overview.md](docs/01-overview.md) — стек, команды, env, деплой
- [docs/02-architecture.md](docs/02-architecture.md) — структура, роутинг, конвенции
- [docs/03-data-clickhouse.md](docs/03-data-clickhouse.md) — запросы, кеши, StatParams/whereClause
- [docs/04-pages.md](docs/04-pages.md) — разделы сайта
- [docs/05-ui-kit.md](docs/05-ui-kit.md) — UI-компоненты и стили
- [docs/06-charts.md](docs/06-charts.md) — графики (chart.js + UniversalChart)
- [docs/07-game-domain.md](docs/07-game-domain.md) — игровой домен, локализация
- [docs/08-external.md](docs/08-external.md) — поддомены, realtime, интеграции

При значимых изменениях архитектуры обновляй соответствующий раздел docs.
