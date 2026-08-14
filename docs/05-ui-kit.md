# UI-компоненты и стили

Два слоя общих компонентов, и это **не** «старое и новое»:

- **`src/shared/uiKit/`** — базовые компоненты без проектных зависимостей: их можно вынуть и перенести в другой проект как есть.
- **`src/shared/ui/`** — имплементации этих баз под специфику сайта, с проектными зависимостями. Именно они используются на страницах.

Примеры связки: `ui/tooltip/textTooltip.ts` оборачивает базовую `uiKit/tooltip/textTooltip`, подставляя проектный `popoverViewportOffset` из шапки сайта; `ui/tipBubble/TipBubble.vue` — обёртка над `uiKit/tipBubble/useTipBubble` с проектными дефолтами (`--content-page-margin`, политика `autoExtend`), и все страницы импортируют именно её.

Новый переносимый примитив клади в `uiKit`, его проектную настройку — в `ui`, а специфичный для одной страницы компонент — рядом со страницей.

## `src/shared/uiKit/`

- **`tableView/`** — виртуализированная таблица (основная таблица проекта). `TableView.vue` — Vue-обёртка; ядро на классах в `tableView/tableView/`: `TableView.ts` (движок), `Section.ts`, `ReusableStorage.ts` (переиспользование DOM-строк как в UITableView), дефолтные строки `default/` (`CellLine`, `HeaderLine`, `FooterLine`, `SelectableCellLine`). Используется в лидерборде Натиска, таблицах танков и т.д. Ячейка с подсветкой поиска — `shared/ui/tableView/cells/HighlightedCell.ts`. Живой стенд со всеми краями — `/debug/table-view`.

  Неочевидное: реактивности внутри нет, `delegate` читается один раз при монтировании, любое изменение данных доезжает только через `dataDidUpdate()`. Высоты объявляет делегат, таблица не измеряет ничего. За размерами контейнера следит `ResizeObserver` на слое прокрутки: он пересчитывает видимый интервал и класс `has-scroll`, но не высоты строк. `scrollTo(path)` ставит строку не под верхний край, а на высоту заголовка секции ниже (чтобы липкая шапка осталась видна); индекс вне набора — `console.warn` и никакой прокрутки. Пустой интервал видимых строк (`from > to`) — нормальное состояние: так таблица отвечает на нулевую высоту контейнера и на `display: none`.
- **`contextMenu/`** — контекстные меню: `ContextMenuRoot.vue` монтируется в App.vue; создание — `createContextMenu.ts` / `simpleContextMenu.ts` / `composition.ts`; строки меню в `lines/` (Button, Header, Separator, Child — вложенные меню).
- **`popover/`** — поповеры: `Popover.vue` (базовый), `PopoverAnimated`, `PopoverAutoClose`, `PopoverStyled`; позиционирование в `utils.ts`. `Popover` независимо сообщает о выходе цели целиком за viewport (`targetOutsideWindow`), о том, что сам поповер не поместился после перебора placements (`popoverOutsideWindow`), и о выходе самого поповера целиком за viewport (`popoverFullyOutsideWindow`); все три считаются относительно вьюпорта, сжатого на `viewportOffset` со всех сторон (та же трактовка, что и при позиционировании). Видимую область даёт `getViewportRect()` из `utils.ts` — она берётся из `visualViewport`, а не из `documentElement.clientHeight`: на iOS Safari layout viewport не пересчитывается при сворачивании тулбара, и внизу экрана появлялась мёртвая зона; попутно это учитывает экранную клавиатуру и пинч-зум. Целью может быть как элемент DOM, так и виртуальная (`VirtualElement` из `utils.ts` — объект с одним `getBoundingClientRect()` в клиентских координатах, который поповер опрашивает каждый кадр); так поповер цепляется к точке без своего элемента, например к точке данных на графике. По умолчанию поповер уходит в общий контейнер `#popover-root` (создаётся лениво в `popoverRoot.ts` при первом показе, на нём не должно быть `position`/`transform`, иначе он станет containing block); `teleportTo` задаёт свой контейнер, а `null` рендерит на месте. У `PopoverAutoClose` проп `closeOnOutsideWindow: 'popover' | 'popover-full' | 'target'` выбирает условие закрытия: `'target'` (по умолчанию) — когда за границы viewport полностью ушла цель, `'popover-full'` — когда полностью ушёл сам поповер, `'popover'` — как только поповер перестал помещаться целиком. У `PopoverStyled` проп `interactive` (по умолчанию `true`) — с `false` карточка не перехватывает указатель. На них построены селекторы фильтров (см. 07).

  Неочевидные дефолты: в базовом `Popover` `viewportOffset` по умолчанию равен `offset` (`viewportOffset ?? offset ?? 0`) — задав только `offset`, молча получаешь такой же отступ от края экрана; в `PopoverStyled` это уже `10`, а `offset` считается от `arrowSize`. `snapToPixels` и `preserveLastPlacement` по умолчанию `true`. Три события про выход за viewport — **фронты**: летят только на переход в «истину», обратных нет, и из-за `immediate` могут прийти сразу при открытии, поэтому состояние по ним не залатчишь. Выбранный после перебора placement наружу не отдаётся — в слоте есть только направление стрелки.
- **`tooltip/`** — тултипы на директивах. Глобальная `v-tooltip` показывает текст; объект значения поддерживает `text`, параметры поповера и опциональный `target: HTMLElement`. Для произвольного содержимого есть `defineTooltip`, а `useTooltip(Component, options)` сразу создаёт локальную директиву, передающую значение биндинга в props компонента. Параметры поповера в `useTooltip` принимают обычные и реактивные значения (`ref` / `computed` / getter); уже открытый тултип обновляется при их изменении. Опция `valueAdapter` позволяет отдельно преобразовать значение в props содержимого и параметры тултипа. На элементе с директивой отслеживаются наведение указателя и касания (фокус сам по себе тултип не открывает), а тултип позиционируется относительно `target` (по умолчанию — относительно самого элемента). На touch-устройствах тултип переключается тапом и закрывается тапом вне цели и самого тултипа; свайп для прокрутки его не закрывает. После перебора разрешённых placements тултип закрывается, только если сам поповер не помещается в viewport с учётом `viewportOffset`.
- **`tipBubble/`** — тултипы-подсказки с «умным» позиционированием: `TipBubble.vue`, `TipBubbleComponent.vue`, `useTipBubble.ts`, отладочное окно `DebugTipWindow.vue`. Проектная обёртка с дефолтами сайта — `shared/ui/tipBubble/`, на страницах используется она. `useTipBubble` проверяет «этот бабл уже приняли» **один раз при вызове**, поэтому принятая подсказка исчезает не в момент принятия, а при следующем монтировании компонента.
- **`focusEffect/`** — эффект подсветки элемента (обучающие подсказки): `FocusEffectRoot.vue` в App.vue, API — `focusEffect.ts`, `RectEffect.vue`.
- **`dropdown/DropDown.vue`** — выпадающий список.
- **`fallbackImg/`** — `FallbackImg.vue` — картинка с фолбэком и кешем ошибок (`store.ts`).
- **`highlightString/`** — подсветка совпадений поиска в строке.
- **`spriteAtlas/SpriteAtlas.ts`** — отрисовка иконок из спрайт-атласов (флаги наций: `shared/game/vehicles/nations/60x40/atlas/atlases.json`).
- **`newFeatureBadge/`** — бейдж «новое» с запоминанием просмотра.
- **`chart/`** — движок графиков UniversalChart, см. [06-charts.md](06-charts.md).

## `src/shared/ui/` — проектный слой

- `tooltip/textTooltip.ts` — `vTextTooltip`: базовая директива плюс `popoverViewportOffset` из шапки сайта.
- `tipBubble/` — `TipBubble.vue`, `TipBubbleText.vue`: обёртки над `uiKit/tipBubble` с проектными дефолтами.
- `chart/` — Vue-обёртки тултипов графиков (`HeaderTooltip.vue`, `FloatingTooltip.vue`) и `VueChartRenderManager.ts`, см. [06-charts.md](06-charts.md).
- `modalWindow/` — модальные окна (`ModalWindow.vue`, `ModalWindowContent.vue`, кнопки).
- `components/Tooltip.vue`; `PopupWindow.vue` — самостоятельный попап, не часть `modalWindow`; `Canvas.vue` — обёртка canvas с ресайзом; `SnowCardWrapper.vue` — сезонное украшение.
- `loaders/` — `Loader.vue` (спиннер), `pageLoader/PageLoader.vue` (для asyncPage).
- `tween/` — анимация чисел: `TweenValue.vue`, `SimpleTweenValue.vue`, `useTweenRef.ts`, `easing.ts`, `processed.ts`. Единственная рабочая реализация — здесь; `src/composition/tween/useTweenRef.ts` **пустой файл на 0 байт**, никем не импортируется и подлежит удалению. `options` (duration/easing/minStep) читаются один раз при setup и не реактивны.
- `tableView/cells/HighlightedCell.ts` — ячейка `TableView` с подсветкой поиска.
- `noScroll/noScroll.ts` — блокировка скролла: класс вешается на `<html>` (не на body), и это **счётчик**, а не переключатель — `requestNoScroll`/`releaseNoScroll`/`useNoScroll`, стили в `noScroll/styles.scss` по `html.no-scroll`. `PopupWindow.vue` и пара страниц вешают `no-scroll` на `body` мимо этого механизма — так делать не надо.

## Форматирование значений — процессоры (`src/shared/utils/processors/`)

Виджеты (`GenericInfo`, tween-значения) принимают `processor` — функцию `number → string`. Готовые: `useRoundProcessor` (округление), `useSpaceProcessor` (разряды через пробел), `useRoundSpaceProcessor`, `useRoundTweenProcessor`, `usePlayerNameProcessor`; фабрики в `processors.ts` (например `createFixedSpaceProcessor`).

## Утилиты (`src/shared/utils/`)

- `core.ts` — общие мелочи; `math.ts` — математика; `time.ts` — форматирование времени (`ms2sec`, `sec2minsec` и т.п. — смотри экспорты; `hourDayExp` к ним **не относится**, это локальная функция внутри `pages/infographics/pages/Battle.vue`).
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
