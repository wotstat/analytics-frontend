# Обзор проекта

## Что это

Фронтенд сайта **wotstat.info** — сервиса аналитики для игр «Мир танков» (Lesta, RU) и World of Tanks (Wargaming, EU/NA/ASIA). Игроки ставят мод `wotstat.analytics`, который отправляет события боёв в ClickHouse, а сайт визуализирует статистику: личная сессия, дистрибутивы урона, статистика режима «Натиск» (Onslaught / COMP7), лидерборды, анализ реплеев, инфографика ивентов и т.д.

Проект — часть экосистемы wotstat (моды, виджеты, позиции, реплеи живут в отдельных репозиториях и на отдельных поддоменах, см. [08-external.md](08-external.md)).

## Стек

- **Vue 3.5** — только Composition API + `<script setup lang="ts">`, стили SCSS scoped.
- **TypeScript** (строгий), **Vite 8**, **Bun** как пакетный менеджер (`bun.lock`).
- **vue-router 5** — SPA с `createWebHistory`.
- **@clickhouse/client-web** — запросы напрямую в ClickHouse из браузера.
- **chart.js 4 + vue-chartjs** — мини-графики; свой SVG-движок графиков в `src/shared/uiKit/chart/universalChart/`.
- **VueUse** (`@vueuse/core`) — активно используется повсюду (`useLocalStorage`, `useWebSocket`, `useElementVisibility`, ...).
- Прочее: `jszip` (архивы модов), `idb-keyval` (IndexedDB), `canvas-confetti`, `motion`, `colorjs.io`, `typescript-cubic-spline`, `@timohausmann/quadtree-ts` (хит-тесты на графиках).
- Markdown как Vue-компоненты через `vite-plugin-markdown` (Mode.VUE) + плагины `@mdit/*` (alert, attrs, align, embed). SVG как компоненты через `vite-svg-loader`.

## Команды

```bash
bun install          # зависимости
bun run dev          # vite --host (dev-сервер)
bun run build        # vue-tsc && vite build --mode prod  ← основная проверка корректности
bun run preview      # предпросмотр сборки
bunx eslint src      # линт (правила: одинарные кавычки, без точек с запятой)
```

Тестов нет. CI-специфики в репозитории нет.

## Окружения и env-переменные

Файлы: `.env.development`, `.env.development.local`, `.env.prod`. Типы объявлены в `src/vite-env.d.ts`:

- `VITE_MODE_DEV_LOCAL` — `'true'` при локальной разработке против локальной БД (включает фолбэк `crypto.randomUUID` в `src/db/index.ts`).
- `VITE_DEFAULT_URL_PREFIX` — префикс поддоменов wotstat, когда сайт открыт не с `*.wotstat.info` (например dev). См. `src/shared/external/externalUrl.ts`.

Прод-сборка: `--mode prod`. Режим логируется в консоль при старте (`main.ts`).

## Деплой

`publish-reserve.sh` — синхронизация `dist/` в S3-бакет `wotstat.info` на Yandex Cloud Object Storage (`aws s3 sync`, профиль `wotstat`), `index.html` с уменьшенным кешем (max-age=300). Основной деплой, судя по названию скрипта, «резервный» — вероятно есть и другой канал вне репозитория.

## Важные ограничения

- **Куда угодно из браузера ходит только по HTTPS на поддомены wotstat.info** — все URL строятся через `externalUrl.ts` с учётом префикса окружения.
- В SQL-запросы значения подставляются интерполяцией строк (санитизации почти нет) — пользователь БД `public` только читает, но при изменениях сохраняй существующий стиль и осторожность.
- Колонки `systemInfo.*` перечислены в `RESTRICTED_COLUMNS` (`src/db/index.ts`) — их нельзя показывать.
- Русский язык интерфейса захардкожен в большинстве компонентов; локаль БД-локализации — константа `LANGUAGE = 'RU'` в `src/shared/i18n/i18n.ts`.
