# UI-компоненты и стили

Два поколения общих компонентов: старое `src/shared/ui/` и новое `src/shared/uiKit/`. Новый код клади в `uiKit` (или рядом со страницей, если компонент специфичен).

## `src/shared/uiKit/`

- **`tableView/`** — виртуализированная таблица (основная таблица проекта). `TableView.vue` — Vue-обёртка; ядро на классах в `tableView/tableView/`: `TableView.ts` (движок), `Section.ts`, `ReusableStorage.ts` (переиспользование DOM-строк как в UITableView), дефолтные строки `default/` (`CellLine`, `HeaderLine`, `FooterLine`, `SelectableCellLine`). Используется в лидерборде Натиска, таблицах танков и т.д. Ячейка с подсветкой поиска — `shared/ui/tableView/cells/HighlightedCell.ts`.
- **`contextMenu/`** — контекстные меню: `ContextMenuRoot.vue` монтируется в App.vue; создание — `createContextMenu.ts` / `simpleContextMenu.ts` / `composition.ts`; строки меню в `lines/` (Button, Header, Separator, Child — вложенные меню).
- **`popover/`** — поповеры: `Popover.vue` (базовый), `PopoverAnimated`, `PopoverAutoClose`, `PopoverStyled`; позиционирование в `utils.ts`. На них построены селекторы фильтров (см. 07).
- **`tooltip/`** — директива текстового тултипа `v-tooltip`. Объект значения поддерживает `text`, параметры поповера и опциональный `target: HTMLElement`: события ховера/фокуса слушаются на элементе с директивой, а тултип позиционируется относительно `target` (по умолчанию — относительно самого элемента).
- **`tipBubble/`** — тултипы-подсказки с «умным» позиционированием: `TipBubble.vue`, `TipBubbleComponent.vue`, `useTipBubble.ts`, отладочное окно `DebugTipWindow.vue`. (В `shared/ui/tipBubble/` — старая версия.)
- **`focusEffect/`** — эффект подсветки элемента (обучающие подсказки): `FocusEffectRoot.vue` в App.vue, API — `focusEffect.ts`, `RectEffect.vue`.
- **`dropdown/DropDown.vue`** — выпадающий список.
- **`fallbackImg/`** — `FallbackImg.vue` — картинка с фолбэком и кешем ошибок (`store.ts`).
- **`highlightString/`** — подсветка совпадений поиска в строке.
- **`spriteAtlas/SpriteAtlas.ts`** — отрисовка иконок из спрайт-атласов (флаги наций: `shared/game/vehicles/nations/60x40/atlas/atlases.json`).
- **`newFeatureBadge/`** — бейдж «новое» с запоминанием просмотра.
- **`chart/`** — движок графиков UniversalChart, см. [06-charts.md](06-charts.md).

## `src/shared/ui/` (старое, но используется)

- `components/Tooltip.vue` — тултип; `PopupWindow.vue`; `Canvas.vue` — обёртка canvas с ресайзом; `SnowCardWrapper.vue` — сезонное украшение.
- `modalWindow/` — модальные окна (`ModalWindow.vue`, `ModalWindowContent.vue`, кнопки).
- `loaders/` — `Loader.vue` (спиннер), `pageLoader/PageLoader.vue` (для asyncPage).
- `tween/` — анимация чисел: `TweenValue.vue`, `SimpleTweenValue.vue`, `useTweenRef.ts`, `easing.ts`, `processed.ts`. Дубликат-вариант есть в `src/composition/tween/useTweenRef.ts`.
- `noScroll/noScroll.ts` — блокировка скролла body (для модалок).

## Форматирование значений — процессоры (`src/shared/utils/processors/`)

Виджеты (`GenericInfo`, tween-значения) принимают `processor` — функцию `number → string`. Готовые: `useRoundProcessor` (округление), `useSpaceProcessor` (разряды через пробел), `useRoundSpaceProcessor`, `useRoundTweenProcessor`, `usePlayerNameProcessor`; фабрики в `processors.ts` (например `createFixedSpaceProcessor`).

## Утилиты (`src/shared/utils/`)

- `core.ts` — общие мелочи; `math.ts` — математика; `time.ts` — форматирование времени (`ms2sec`, `sec2minsec`, `hourDayExp` и т.п. — смотри экспорты).
- `refDebouncedCheck.ts`, `refThrottledCheck.ts` — реактивные обёртки.
- `types/` — `Prettify`, `ComponentInstance`.
- `shared/composition/useMeta.ts` — установка title/meta страницы; `useHasScroll.ts`.

## Стили (`src/styles/`)

Глобально подключается `index.scss` (из main.ts). Внутри:

- `variables.scss` — CSS-переменные темы (тёмная тема — единственная): цвета текста, фоны карточек и т.д.
- `mixins.scss` — SCSS-миксины (используются через `@use '@/styles/mixins.scss' as *;`).
- `table.scss` — стили классических таблиц; `nice-scrollbar.scss`; `textColors.scss` (классы `.green/.red/...`); `markdown.scss` — оформление markdown-страниц; `mtfont.scss` — игровой шрифт; `shared.scss`.
- Карточки инфографики — классы `.card`, `.card-main-info` и грид-раскладки задаются в самих страницах.

Конвенция: компонентные стили — `<style scoped lang="scss">`, глобальные токены — через CSS-переменные из `variables.scss`.
