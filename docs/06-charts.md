# Графики

В проекте два механизма графиков: **chart.js** (простые мини-графики в карточках) и собственный SVG-движок **UniversalChart** (сложные интерактивные графики, например деталка лидерборда Натиска).

## chart.js (мини-графики карточек)

- Регистрация компонентов и глобальные дефолты — в `src/main.ts` (белый текст, Inter, borderColor полупрозрачный, анимация 400мс).
- Обёртки: `src/pages/infographics/shared/widgets/charts/MiniBar.vue`, `MiniPie.vue` — принимают `status: Status`, `data`, `color` (имя из палитры), `labels`, `callbacks` (тултипы chart.js).
- `ShadowBarController.ts`, `ShadowLineController.ts`, `ShadowPieController.ts` — кастомные контроллеры chart.js, рисующие «свечение» (shadow/bloom) под данными; цвета — `pages/infographics/shared/bloomColors.ts`.
- `src/shared/ui/chart/VueChartRenderManager.ts` — менеджер перерисовки.

## UniversalChart (`src/shared/uiKit/chart/universalChart/`)

Собственный ООП-движок графиков на SVG. Не Vue-реактивный внутри: Vue-обёртка `UniversalChart.vue` создаёт экземпляр класса `UniversalChart` (файл `UniversalChart.ts`), дальше всё императивно.

### Устройство

- **`UniversalChart.ts`** — корневой класс: держит SVG, дата-спейсы, компоненты, цикл лейаута (`onBeforeLayout` → layout → рендер), `setRenderBounds` (текущая видимая область данных).
- **`utils/`** — базовые сущности: `Bounds` (прямоугольник в дата-координатах), `Point`, `ChartSpace` (преобразование данные↔пиксели), `PlotGroup`.
- **`plot/`** — рендереры данных: `BasePlotRenderer`, `line/autoLine/AutoLine.ts` (линия, monotone-сплайн `MonotoneXPath`), `area/RectangleArea`, `markers/autoMarkers/AutoMarkers` (точки).
  - `MonotoneXPath` строит SVG path двумя эквивалентными реализациями: Zig→wasm (`monotoneXPath/monotoneXPath.zig`, сборка `build.sh`, требуется zig) и TS-фоллбек в том же файле. Обе включают клиппинг по видимой области и децимацию точек в пиксельных координатах: M4-схлопывание точек внутри одного пиксельного столбца (вход/выход/мин/макс + соседи для сохранения касательных) и «коридорное» схлопывание почти коллинеарных участков (ε=0.05px). При изменении алгоритма правь обе реализации синхронно и пересобирай wasm.
- **`axis/Axis.ts`**, **`ticks/`** (`TicksByLabels`, `TicksByValues`, `BaseOffsetTicks`), **`labels/autoLabels/`** (автогенерация подписей: `steppedGenerator`, `arrayGenerator`).
- **`defs/`** — SVG defs: градиенты, клипы, маски, паттерны.
- **`hover/`** — интерактивность:
  - `basePlotHover/` — **конечный автомат** ввода (`StateMachine.ts`, состояния в `states/`: mouse hover/pan, touch hover/pan/zoom, ожидание распознавания жеста).
  - `composableHover/ComposableHover.ts` — составной ховер из компонентов: `ChartTooltip`, вертикальная/горизонтальная линии, `NearestMarker` (ближайшая точка, поиск через quadtree), `ZoomChartComponent`.
- **`ChartRenderManager.ts`**, `BaseChart.ts` — базовая инфраструктура рендера.

### ZoomChartComponent — зум/пан/инерция

`hover/composableHover/components/zoomChartComponent/` — пан мышью/тачем, зум колесом и пинчем, инерция, «резиновые» лимиты. **Есть подробный `readme.md` прямо в папке** — обязательно читай его перед изменениями; там же список неочевидных решений с пометкой «не чинить». Компонент завершён, автор просил не закладывать в него архитектуру «на будущее». Единственное место использования: `src/pages/infographics/pages/onslaught/leaderboard/components/detail/Charts.ts`.

### Связка графиков (hover / bounds sync)

`hover/composableHover/sync/` — синхронизация нескольких `UniversalChart` по принципу **координатный фрейм ≠ viewport**: примитив синка живёт в chart-space, поэтому не зависит от зума, а каждый график сам проецирует его в свои пиксели и снапит/фитит по **своим** данным. Два независимых хаба (можно включать по отдельности), оба создаются один раз в `Detail.vue` и передаются в компоненты:

- **`HoverSynchronizer`** (hover-sync): навёл на один график — hover (линия/маркер/тултип) зажигается на всех связанных в той же точке фрейма. Добавляется в каждый `ComposableHover` (`addComponent`) и передаётся консьюмерам (`VerticalLine`/`NearestMarker`/`ChartTooltip`, опция `hoverSync`); локальный hover приоритетнее внешнего.
- **`BoundsSynchronizer`** (bounds-sync): зазумил/пропанил один — связанные синхронно повторяют окно ведущей оси (направление как у `panDirection`: `new BoundsSynchronizer('horizontal' | 'vertical' | 'all')`), каждый анимируя свою auto-fit ось. Передаётся в `ZoomChartComponent` опцией `boundsSync`. **Идёт через `ZoomChartComponent`**, а не через `chart.setRenderBounds` напрямую (иначе auto-fit ось ведомого снапит — детали в его `readme.md`).

Референс проводки — `detail/Charts.ts` + `detail/Detail.vue` (лидерборд Натиска).

### Пример использования

Смотри `detail/Charts.ts` (лидерборд Натиска) — там собран полный граф: чарт + оси + линии + ховер с тултипом + зум с лимитами. Это лучший референс при создании нового графика на UniversalChart.

## Когда что использовать

- Карточка со статичным распределением/долями → `MiniBar`/`MiniPie` (chart.js).
- Интерактивный таймсерийный график с зумом/тултипами → UniversalChart.
- Новую библиотеку графиков не добавлять.
