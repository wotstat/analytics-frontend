# Карта проекта

Фронтенд **wotstat.info** — аналитика для «Мира танков» и World of Tanks.
Правила работы и проверки — в [AGENTS.md](../AGENTS.md), общие антипаттерны — в [code-mistakes.md](code-mistakes.md), готовые компоненты — в [ui-kit.md](ui-kit.md).

## Основа

- Vue 3: Composition API, `<script setup lang="ts">`, TypeScript. Сборка — Vite, пакетный менеджер — Bun.
- Маршрутизация — Vue Router, общие composable — VueUse. Стили компонентов — SCSS scoped, алиас `@` ведёт в `src/`.
- Аналитические данные запрашиваются из браузера через `@clickhouse/client-web` и web-прокси ClickHouse.
- Состояние — `ref` / `computed`, параметры URL и `useLocalStorage`; Pinia/Vuex нет.
- Команды запуска — в [корневом README](../README.md), актуальные scripts и зависимости — в [package.json](../package.json).

## Иерархия

Основные каталоги:

```text
src/
  main.ts, App.vue   — запуск приложения и общий каркас
  routes.ts         — маршруты сайта
  pages/            — страницы по разделам сайта; внутри — компоненты и логика раздела
    infographics/   — сессионная статистика, техника, Натиск
    shared/         — общий каркас страниц: шапка, боковая панель и прочее
    debug/          — примеры и ручная проверка на /debug
    metaStudio/     — студия Open Graph на /meta
  shared/
    uiKit/          — переносимые UI-примитивы и механизмы без специфики сайта
    ui/             — общие компоненты с оформлением и зависимостями сайта
    game/           — domain: игровые данные и правила; components: UI; encoding: компактные значения
    i18n/           — локализация игровых названий
    legacyStatQuery/ — общие фильтры и SQL-условия старых страниц инфографики
    external/       — адреса внешних сервисов и интеграции
    composition/    — общие composable
    utils/          — общие утилиты
    global/         — общие настройки и состояние
  db/               — клиент ClickHouse, запросы и кеширование
  meta/             — механизм Open Graph: определения, resolver, контексты и renderer
  styles/           — глобальные стили, переменные и миксины
  assets/           — иконки и изображения
```

Код конкретной страницы хранится рядом с ней; общий для раздела — внутри этого раздела. Переиспользуемый между разделами код находится в `shared/`. Переносимые UI-примитивы относятся к `uiKit/`, их настройка под сайт — к `ui/`. Компоненты называются `PascalCase.vue`, composable — `useXxx.ts`.

## Точки входа

| Задача | Где смотреть |
| --- | --- |
| Найти страницу | [routes.ts](../src/routes.ts), затем каталог компонента страницы |
| Добавить UI | [Каталог компонентов](ui-kit.md), примеры в [pages/debug/](../src/pages/debug/) |
| Работать с URL-параметрами | [useQueryStorage.ts](../src/shared/uiKit/queryStorage/useQueryStorage.ts), готовые определения в [params.ts](../src/shared/uiKit/queryStorage/params.ts); параметры страницы объявляются рядом с ней |
| Загрузить данные | [db/index.ts](../src/db/index.ts): `queryComputed`, `queryAsync`, `query`; SQL и типы результатов — у потребителей, актуальная схема таблиц — в самой БД |
| Изменить формат ссылок сравнения | [query/codec/](../src/pages/infographics/pages/vehicles/timeSeriesCompare/query/codec/), включая тест и фиксированные примеры; общие примитивы — [utils/encoding/](../src/shared/utils/encoding/), игровые компактеры — [game/encoding/](../src/shared/game/encoding/) |
| Работать с Open Graph | Механизм — [meta/](../src/meta/), общий дизайн — [shared/ui/meta/](../src/shared/ui/meta/), карточки страниц — рядом со страницами, студия — [pages/metaStudio/](../src/pages/metaStudio/) |
| Изменить сборку или окружение | [vite.config.ts](../vite.config.ts), [vite-env.d.ts](../src/vite-env.d.ts), [build-meta.sh](../build-meta.sh), [workflows/](../.github/workflows/) |

В `/docs` сохраняем краткую базу и навигацию. API, алгоритмы и форматы изучаем по исходникам, типам и примерам использования. Если модулю нужно отдельное пояснение, оно живёт в README рядом с кодом.
