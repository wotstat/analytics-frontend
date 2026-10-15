# Обзор проекта

## Что это

Фронтенд сайта **wotstat.info** — сервиса аналитики для игр «Мир танков» (Lesta, RU) и World of Tanks (Wargaming, EU/NA/ASIA). Игроки ставят мод `wotstat.analytics`, который отправляет события боёв в ClickHouse, а сайт визуализирует статистику: личная сессия, дистрибутивы урона, статистика режима «Натиск» (Onslaught / COMP7), лидерборды, анализ реплеев, инфографика ивентов и т.д.

Проект — часть экосистемы wotstat (моды, виджеты, позиции, реплеи живут в отдельных репозиториях и на отдельных поддоменах, см. [08-external.md](08-external.md)).

## Стек

- **Vue 3.5** — только Composition API + `<script setup lang="ts">`, стили SCSS scoped.
- **TypeScript** (строгий), **Vite 8**, **Bun** как пакетный менеджер (`bun.lock`).
- **vue-router 5** — SPA с `createDeferredWebHistory`: адрес браузера записывается после обновления компонентов и синхронизации query.
- **@clickhouse/client-web** — запросы напрямую в ClickHouse из браузера.
- **UniversalChart** — собственный SVG-движок графиков в `src/shared/uiKit/chart/universalChart/`.
- **VueUse** (`@vueuse/core`) — активно используется повсюду (`useLocalStorage`, `useWebSocket`, `useElementVisibility`, ...).
- Прочее: `fflate` (архивы модов и DEFLATE для ссылок сравнения), `idb-keyval` (IndexedDB), `canvas-confetti`, `motion`, `colorjs.io`, `typescript-cubic-spline`, `@timohausmann/quadtree-ts` (хит-тесты на графиках).
- Markdown как Vue-компоненты через `vite-plugin-markdown` (Mode.VUE) + плагины `@mdit/*` (alert, attrs, align, embed). SVG как компоненты через `vite-svg-loader`.

## Команды

```bash
bun install          # зависимости
bun run dev          # vite --host (dev-сервер; студия Open Graph: /meta)
bun run check        # тесты и проверки типов
bun run build        # тесты, проверка типов, SPA и meta-артефакт одной версии
bun run test         # Bun: совместимость бинарных ссылок compare
bun run preview      # предпросмотр SPA со студией Open Graph на /meta
bunx eslint src      # линт (правила: одинарные кавычки, без точек с запятой)
```

Новые юнит-тесты добавляем только по явному запросу пользователя. Первый тест — совместимость бинарных ссылок `compare`: фиксированные ссылки и ожидаемые модели в JSON, запуск встроенным раннером Bun без браузера и сети. `bun run build` сначала запускает тесты; при их падении проверка типов и Vite не запускаются. Подробнее — [формат сравнения](comparison-query-format.md). Остальные проверки — сборка, ESLint и ручная проверка в браузере.

## Окружения и env-переменные

Файлы: `.env.development`, `.env.development.local`, `.env.prod`. Типы объявлены в `src/vite-env.d.ts`:

- `VITE_MODE_DEV_LOCAL` — `'true'` при локальной разработке против локальной БД (в режиме `development` включает полифилы `crypto.randomUUID` и `crypto.subtle.digest('SHA-256')` из `src/db/devPolyfill/`, если браузер не предоставляет эти API).
- `VITE_DEFAULT_URL_PREFIX` — префикс поддоменов wotstat, когда сайт открыт не с `*.wotstat.info` (например dev). См. `src/shared/external/externalUrl.ts`.

Прод-сборка: `--mode prod`. Режим логируется в консоль при старте (`main.ts`).

Open Graph использует корневой `vite.config.ts` с целями `BUILD_TARGET=meta-renderer`
и `BUILD_TARGET=meta-server` и тот же корень env-файлов. Основной SPA выбирает `main`.
Renderer не запускает основное приложение или Метрику; студия — страница
основного SPA. Подробнее: [11-open-graph.md](11-open-graph.md).

## Деплой

Продовый CI — `.github/workflows/deploy.yml`: push в `main` или ручной запуск.
`bun run build` собирает SPA и meta, затем `scripts/release.ts` создаёт
`dist-meta/release.json`: SHA-256 каждого файла обеих сборок и общий content ID.
`dist/index.html` и `dist-meta/spa.html` должны совпадать. Манифест проверяется на сервере.

CI сохраняет независимую резервную публикацию `dist/` в S3, затем загружает
`dist/` и `dist-meta/` в `APP_PATH/incoming/<run-id>-<attempt>/` и вызывает
`META_APP_PATH/current/rerun.sh frontend --app-dir META_APP_PATH --incoming ...`.
S3 остаётся аварийным каналом для ручного переключения DNS; его `sync --delete`
не участвует в политике хранения основного сервера.

GitHub Actions variables:

- `APP_PATH` = `/app/wotstat/analytics-frontend`;
- `META_APP_PATH` = `/app/wotstat/og-meta` (это значение используется по умолчанию).

Secrets SSH прежние: `SSH_HOST`, `SSH_USER`, `SSH_KEY`; для S3 — `ACCESS_KEY_ID`,
`SECRET_ACCESS_KEY`. На Linux-сервере нужны Bun 1.4.3, Docker с Compose v2,
`flock` из `util-linux`, права на Docker и запись в каталоги обоих приложений.
Первый meta deployment запускается вручную на сервере с новой frontend-сборкой
через `rerun.sh meta --incoming`. После его успешной активации
появляется `META_APP_PATH/current`, и можно запускать обычный frontend CI.

На основном сервере:

- `releases/<id>/dist` и `releases/<id>/dist-meta` — неизменяемый комплект;
- `shared/assets` — общий каталог хешированных assets, `/assets/` раздаётся отсюда;
- `current` — ссылка на `dist` успешно активированного релиза для public-файлов и SPA fallback.

Скрипт meta-сервиса под общим lock запускает свободный blue/green слот, ждёт
контексты и Chromium, проверяет HTML/PNG, переключает только внутренний Nginx,
проверяет версию через gateway, переключает fallback и удаляет старый контейнер.
Внешний Nginx при обычных деплоях не перезагружается. Неуспешное переключение
восстанавливает прошлую версию; прерванное — восстанавливается перед следующей операцией.
После ребута Docker запускает gateway и активную мету. `rerun.sh start --app-dir META_APP_PATH`
восстанавливает сохранённый релиз после остановки или удаления контейнеров без новой сборки.

Активный и предыдущий успешный релизы защищены от удаления. Остальные сохраняются
7 дней + 300 секунд после окончания выдачи их HTML. Assets удаляются только когда
их нет ни в одном сохраняемом манифесте; время изменения файлов не используется.
Откат запускает свежий процесс с предыдущими Docker image и frontend-артефактом.
Давно открытая вкладка после окончания срока хранения может потребовать обновления.

Первый запуск и справка по командам:
[analytics-frontend-meta: деплой](../../analytics-frontend-meta/README.md#деплой).
Контракт renderer и контекстов — в [Open Graph](11-open-graph.md).

## Важные ограничения

- **Внешние запросы идут по HTTPS на поддомены wotstat.info** — URL строятся через `externalUrl.ts` с учётом префикса окружения. В dev используется тот же прямой доступ, без Vite proxy; нужные заголовки должны быть разрешены CORS сервера.
- В SQL-запросы значения подставляются интерполяцией строк (санитизации почти нет) — пользователь БД `public` только читает, но при изменениях сохраняй существующий стиль и осторожность.
- Колонки `systemInfo.*` перечислены в `RESTRICTED_COLUMNS` (`src/db/index.ts`) — их нельзя показывать.
- Русский язык интерфейса захардкожен в большинстве компонентов; локаль БД-локализации — константа `LOCALE = 'RU'` в `src/shared/i18n/i18n.ts`.
