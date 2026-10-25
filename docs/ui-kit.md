# Готовый UI

Перед созданием компонента проверь существующие. `src/shared/uiKit/` содержит переносимые основы, `src/shared/ui/` — компоненты сайта. Если есть проектная обёртка, начинай с неё: например, `PanelPopover`, `TipBubble` и текстовый тултип учитывают оформление и каркас сайта.

Ниже — точки входа, без пересказа API. Props, события и типы смотри в исходнике. Живые примеры доступны на `/debug`, их код — в [pages/debug/](../src/pages/debug/), каталог — в [debug/routes.ts](../src/pages/debug/routes.ts).

## Компоненты

| Что нужно | Готовый код | Пример на сайте |
| --- | --- | --- |
| Кнопка тулбара | [ToolbarButton](../src/shared/ui/toolbarButton/ToolbarButton.vue) | `/debug/toolbar-button` |
| Плитка выбора | [SelectionTile](../src/shared/ui/selectionTile/SelectionTile.vue) | `/debug/selection-tile` |
| Выбор одного варианта | [OptionsSelect](../src/shared/ui/optionsSelect/OptionsSelect.vue) | `/debug/options-select` |
| Выпадающий список и стрелки раскрытия | [dropdown/](../src/shared/uiKit/dropdown/) | `/debug/misc`, `/debug/dropdown-arrow` |
| Текстовая подсказка | Глобальная `v-tooltip`, проектная директива [vTextTooltip](../src/shared/ui/tooltip/textTooltip.ts) | `/debug/tooltip` |
| Подсказка с Vue-компонентом | [useTooltip](../src/shared/uiKit/tooltip/useTooltip.ts) | `/debug/tooltip` |
| Всплывающая панель | [PanelPopover](../src/shared/ui/popover/PanelPopover.vue); базовые варианты — [popover/](../src/shared/uiKit/popover/) | `/debug/panel-popover`, `/debug/popover` |
| Контекстное меню | [contextMenu/](../src/shared/uiKit/contextMenu/): `simpleContextMenu`, `createContextMenu` | `/debug/context-menu` |
| Модальное окно | [modalWindow/](../src/shared/ui/modalWindow/): `ModalWindow`, `ModalWindowContent`, кнопки | `/debug/modal-window` |
| Обучающая подсказка | [TipBubble](../src/shared/ui/tipBubble/TipBubble.vue) | `/debug/tip-bubble` |
| Подсветка элемента поверх страницы | [focusEffect/](../src/shared/uiKit/focusEffect/) | `/debug/focus-effect` |
| Таблица с Vue-слотами и раскрытием строк | [ComposableTable](../src/shared/ui/composableTable/ComposableTable.vue) | `/debug/composable-table` |
| Виртуализированная таблица для больших списков | [TableView](../src/shared/uiKit/tableView/TableView.vue) | `/debug/table-view` |
| Панель временного графика с toolbar, легендой и tooltip | [TimeSeriesPanel](../src/shared/ui/chart/timeSeries/panel/TimeSeriesPanel.vue) | `/debug/time-series-panel` |
| Временной график и его toolbar | [timeSeries/](../src/shared/ui/chart/timeSeries/) | `/debug/time-series`, `/debug/chart-toolbar` |
| Собственный график: линии, столбцы, оси, интерактив | [UniversalChart](../src/shared/uiKit/chart/universalChart/) | `/debug/chart/plots`, `/debug/chart/axis`, `/debug/chart/interaction` |
| Легенда, цвета и подсказки рядов | [legend/](../src/shared/ui/chart/legend/), [tooltip/](../src/shared/ui/chart/tooltip/) | `/debug/series-tooltip` |
| Выбор цвета | [colorPicker/](../src/shared/uiKit/colorPicker/) | — |
| Фон страницы | [pageBackground/](../src/shared/uiKit/pageBackground/): `useBackground`, `DefineBackground` | `/debug/page-background` |
| Анимация чисел | [tween/](../src/shared/ui/tween/): `TweenValue`, `SimpleTweenValue`, `useTweenRef` | `/debug/tween` |
| Индикаторы загрузки | [loaders/](../src/shared/ui/loaders/) | `/debug/misc` |
| Изображение с запасным вариантом | [FallbackImg](../src/shared/uiKit/fallbackImg/FallbackImg.vue) | `/debug/misc` |
| Подсветка совпадений поиска | [HighlightString](../src/shared/uiKit/highlightString/HighlightString.vue) | `/debug/misc` |
| Бейдж «новое» и спрайт-атлас | [newFeatureBadge/](../src/shared/uiKit/newFeatureBadge/), [spriteAtlas/](../src/shared/uiKit/spriteAtlas/) | `/debug/misc` |

Игровой UI находится в [game/components/](../src/shared/game/components/): селекторы техники, карт, режимов и версий игры, иконки техники и наций, миникарта, ранги Натиска. Примеры — в игровых разделах `/debug`.

Карточки старой инфографики (`GenericInfo`, `GenericInfoQuery`, `MiniBarNew`) — в [infographics/shared/widgets/](../src/pages/infographics/shared/widgets/). Общий дизайн Open Graph (`MetaCard`, фоны) — в [ui/meta/components/](../src/shared/ui/meta/components/), просмотр — на `/meta`.

## Оформление и значения

- Глобальные стили — [styles/index.scss](../src/styles/index.scss), переменные и миксины — [variables.scss](../src/styles/variables.scss) и [mixins.scss](../src/styles/mixins.scss). Для прокрутки уже есть [nice-scrollbar.scss](../src/styles/nice-scrollbar.scss).
- Форматирование чисел — [utils/processors/](../src/shared/utils/processors/), времени — [utils/time.ts](../src/shared/utils/time.ts), игровых названий — [i18n/](../src/shared/i18n/).
- Иконки и изображения — в [assets/](../src/assets/); SVG можно импортировать как Vue-компоненты.
