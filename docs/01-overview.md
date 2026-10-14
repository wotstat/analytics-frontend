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
После `bun run build` он сохраняет публикацию `dist/` в S3-бакет `wotstat.info`
и копирует по SSH обе сборки в каталог из GitHub Actions variable `APP_PATH`
(задать `/app/wotstat/analytics-frontend`):

- `dist/` — основной сайт;
- `dist-meta/` — `server.mjs`, копия SPA как `spa.html` и browser renderer в `client/`.

Нужны secrets `SSH_HOST`, `SSH_USER`, `SSH_KEY`; пользователь SSH должен иметь право
записи в каталог назначения. Перед `rsync --delay-updates` CI обновляет `mtime` файлов
в `dist/assets/` и `dist-meta/client/assets/`; `rsync -a` переносит эти даты на сервер.
После успешного копирования удаляются файлы из этих двух каталогов, которые не входили
ни в одну опубликованную сборку больше 7 дней. Текущие assets сохраняются независимо
от того, когда впервые появились. Очистка выполняется при деплое; продовые запуски CI идут по одному.
На этом этапе CI только доставляет файлы: подключение Nginx и перезапуск
`analytics-frontend-meta` выполняются отдельно. Контракт артефакта — в [11-open-graph.md](11-open-graph.md).

S3 остаётся резервным каналом после переключения Nginx; до переключения сайт работает
по прежней схеме. `publish-reserve.sh` позволяет обновить S3 вручную через AWS-профиль `wotstat`.

## Важные ограничения

- **Внешние запросы идут по HTTPS на поддомены wotstat.info** — URL строятся через `externalUrl.ts` с учётом префикса окружения. В dev используется тот же прямой доступ, без Vite proxy; нужные заголовки должны быть разрешены CORS сервера.
- В SQL-запросы значения подставляются интерполяцией строк (санитизации почти нет) — пользователь БД `public` только читает, но при изменениях сохраняй существующий стиль и осторожность.
- Колонки `systemInfo.*` перечислены в `RESTRICTED_COLUMNS` (`src/db/index.ts`) — их нельзя показывать.
- Русский язык интерфейса захардкожен в большинстве компонентов; локаль БД-локализации — константа `LOCALE = 'RU'` в `src/shared/i18n/i18n.ts`.
