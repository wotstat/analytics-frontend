# Графики

В проекте два механизма графиков: **chart.js** (простые мини-графики в карточках) и собственный SVG-движок **UniversalChart** (сложные интерактивные графики, например деталка лидерборда Натиска).

## chart.js (мини-графики карточек)

- Регистрация компонентов и глобальные дефолты — в `src/main.ts` (белый текст, Inter, borderColor полупрозрачный, анимация 400мс).
- Обёртки: `src/pages/infographics/shared/widgets/charts/MiniBar.vue`, `MiniPie.vue` — принимают `status: Status`, `data`, `color` (имя из палитры), `labels`, `callbacks` (тултипы chart.js).
- `ShadowBarController.ts`, `ShadowLineController.ts`, `ShadowPieController.ts` — кастомные контроллеры chart.js, рисующие «свечение» (shadow/bloom) под данными; цвета — `pages/infographics/shared/bloomColors.ts`.
- `src/shared/ui/chart/VueChartRenderManager.ts` — менеджер перерисовки.
- `pages/infographics/pages/onslaught/general/rankDistribution/` — специализированный flex-график распределения игроков по рангам. Общая с дневным графиком цветовая схема рангов вынесена в `onslaught/shared/rankColors.scss`.

## UniversalChart (`src/shared/uiKit/chart/universalChart/`)

Собственный ООП-движок графиков на SVG. Не Vue-реактивный внутри: Vue-обёртка `UniversalChart.vue` создаёт экземпляр класса `UniversalChart` (файл `UniversalChart.ts`), дальше всё императивно.

### Устройство

- **`UniversalChart.ts`** — корневой класс: держит SVG, дата-спейсы, компоненты, цикл лейаута (`onBeforeLayout` → layout → рендер), `setRenderBounds` (текущая видимая область данных). Состав меняется на живом графике: `addPlot`/`addSlot`/`addDefs` и парные `removePlot`/`removeSlot`/`removeDefs` (снятие вынимает корневой элемент из DOM и зовёт `detach`; пустые группы пути при этом остаются). Пересоздавать чарт ради смены состава не нужно — `UniversalChart.vue` к тому же переприцепляет инстанс сам при смене prop `chart`.
- **События чарта** (`utils/EventEmitter.ts`, есть `on`/`once`/`off`): `onSetRenderBounds` — запрошенные пользователем границы; `onAfterRender` — фактические `space`/`overflow`/`full` готового кадра. Второе и есть способ узнать реальные bounds и layout после авто-фита: опрашивать `chart.space` по rAF не нужно.
- **`style.scss` целиком лежит в `@layer ui-kit-chart`.** Любое правило страницы вне слоя перебивает движок независимо от специфичности, поэтому переопределять цвета и размеры можно самыми короткими селекторами, без `!important` и без гонки вложенности. Единственная оговорка каскада: для `!important` порядок обратный — важное внутри слоя победило бы важное снаружи, поэтому `!important` в движке не место. Движок задаёт только то, без чего рендер неверен (`contain`, `fill: none` у линий, `pointer-events`, скрытие probe-подписи) плюс цвета через `currentColor`; тики не красит вовсе.
- **`utils/`** — базовые сущности: `Bounds` (прямоугольник в дата-координатах), `Point`, `ChartSpace` (преобразование данные↔пиксели), `PlotGroup`, `follower.ts` (`CriticalFollower` — критически демпфированный follower к цели, которая может двигаться каждый кадр; ведёт auto-fit ось в `ZoomChartComponent` и тултип между точками в `FloatingTooltip`).
- **`plot/`** — рендереры данных: `BasePlotRenderer`, `line/autoLine/AutoLine.ts` (линия, monotone-сплайн `MonotoneXPath`), `line/autoLine/AutoLineArea.ts` (заливка между двумя линиями, опционально с самими линиями; нижняя линия хранится в обратном порядке и служит обратным краем полигона), `bar/Bar.ts` (столбцы grouped/stacked с layout-padding и независимыми радиусами внешних/внутренних углов; `padding < 1` задаёт долю ширины координатной ячейки, а `grouped.innerPadding < 1` — долю промежутка в паре bar+промежуток), `area/RectangleArea`, `area/PolygonArea`, `markers/autoMarkers/AutoMarkers` (точки). `Bar<TCategory = number, TBarDatum = number>` принимает датасеты и опциональные метаданные категорий через единственный `setData({ datasets, categories? })`: число групп определяется датасетами, категория нужна только для `hit.category`, datum принадлежит отдельному столбцу. Без categories поле `hit.category` равно `undefined`; кастомный datum обязан содержать числовой `value`. `BasePlotRenderer.getBounds()` централизованно учитывает опцию `affectsBounds`, а наследники реализуют только `calculateBounds()`: линии, коридор, столбцы и полигон включены по умолчанию, маркеры и прямоугольная область выключены. При ограничении одной из осей фигура целиком за её пределами возвращает пустые bounds и не влияет на auto-fit второй оси. `PolygonArea.setPoints(Point[] | Point[][])` строит один замкнутый SVG path с несколькими subpath для отверстий. Рендерер всегда делает bbox-culling: не обрезает геометрию, а целиком очищает path, когда общий bbox контуров перестал пересекать область построения. Bar, AutoLine, AutoMarkers и PolygonArea дополнительно владеют собственным `interaction`-источником для hit-testing — см. «Интерактив» ниже.
  - `MonotoneXPath` строит SVG path двумя эквивалентными реализациями: Zig→wasm (`monotoneXPath/monotoneXPath.zig`, сборка `build.sh`, требуется zig) и TS-фоллбек в том же файле. Загрузился ли бинарь, видно снаружи: `monotoneXPathWasmReady()` (промис) и `getMonotoneXPathWasmStatus()` (`'loading' | 'ready' | 'failed'`). Обе включают клиппинг по видимой области и децимацию точек в пиксельных координатах: M4-схлопывание точек внутри одного пиксельного столбца (вход/выход/мин/макс + соседи для сохранения касательных) и «коридорное» схлопывание почти коллинеарных участков (ε=0.05px). При изменении алгоритма правь обе реализации синхронно и пересобирай wasm.
- **`axis/`**, **`ticks/`** (`TicksByLabels` — composite по уровням, `TicksByValues`, `BaseOffsetTicks`), **`labels/autoLabels/`** (автогенерация подписей: `steppedGenerator`, `arrayGenerator`).
  - В `axis/` две разные сущности, не путать. **`PlotAreaBorder`** — рамка области построения, отделяющая её от слотов: привязана к геометрии, сторона задаётся строкой `'space'` (по границе области) или `'full'` (через весь SVG). **`ChartAxis`** — ось по значению данных: `new ChartAxis('vertical', 0)` даёт нулевую линию. `axis` называет ось, на которой отложено значение (как у тиков и подписей): `'vertical'` — значение по Y, линия горизонтальная. Варианта `full` у неё нет — линия по координате живёт только внутри области построения и за её границами не рисуется.
  - Длина штрихов (`start`/`end`) у `TicksByValues` задаётся только в конструкторе. У `TicksByLabels` она настраивается на лету (`updateOptions`) и по умолчанию берётся из итога кадра: у каждого уровня есть `suggestedStart` — расстояние до внешнего края своего этажа у `interval`, `4` у `classic`/`classic-flow`/`cell` на уровне подписей, `0` у дополнительных генераторных уровней. Явный `start` перебивает подсказку.
  - Тиков движок не красит: у `.tick` в `style.scss` нет ни stroke, ни толщины, цвет задаёт страница. Рамка и оси красятся через `currentColor`.
  - `AutoLabels` перебирает шаги из `values` от мелкого к крупному и берёт первый, на котором подписи не пересекаются. Индекс примеряемого кандидата приходит вторым аргументом в `labelForValue(v, step)` — этим же каналом можно узнать и победивший шаг (последний вызов за проход); в итоге кадра его нет намеренно, там лежит только то, что читают тики. `keyForValue` по умолчанию равен **тексту** подписи, а ключ — это тождество `<text>` между кадрами: повторяющийся текст в пределах одного этажа (часы по дням, дни недели) схлопывает разные значения в один элемент, и часть подписей молча пропадает при живых тиках. Для таких форматов задавай ключ по значению — движок про коллизию не предупредит. Как позиционировать подпись, решает `strategy`:
    - Третий аргумент конструктора задаёт сторону: `top`/`bottom` для горизонтальной оси, `left`/`right` для вертикальной. Если аргумент опущен, остаются прежние стороны `bottom` и `left`. `labelOffset` всегда считается наружу от границы области построения до ближайшего края текста.
    - `'classic'` / `'classic-flow'` — подпись по центру своего значения; `flow`-вариант дополнительно прижимает крайние подписи к границам области (`extend` + `fit`).
    - `{ type: 'interval' }` — подпись внутри отрезка между соседними значениями (`placement: start | middle | end`), схлопывание — по ширине отрезка. Для осей-периодов (недели и т.п.).
    - `{ type: 'cell', size }` — для bar-графиков: подпись позиционируется относительно **базовой** ячейки `[v, v + size]` (по умолчанию по центру), а не относительно текущего шага. Когда шаг схлопывается (1 → 2 → 4), число остаётся по центру своей колонки и может торчать за её пределы; схлопывание решается по пересечению с соседями, как в `classic`. Значения подписей при этом — левые границы ячеек, поэтому `to` задаётся индексом последней колонки (а не правым краем, как у `interval`).
  - **Multi-level labels поддерживаются только по X.** Каждый элемент `values` — кандидат шага в форме `LabelLevel | LabelLevel[]`: одиночный уровень можно передать напрямую, а в массиве первый уровень основной и следующие идут от ближнего этажа к дальнему. У каждого этажа свой генератор и могут быть свои `labelForValue`, `keyForValue`, `strategy`, `ticks`, лимиты и `classes`. Генераторы независимы и не обязаны иметь общие значения: календарные часы 00:00 и игровые сутки 03:30 — нормальный случай. Кандидат выбирается, только если рассчитались все его этажи; если любой не поместился, `AutoLabels` переходит к следующему кандидату.
    - `'labels'` в `ticks` относится к подписям **своего** этажа. `interval`-тик проходит от графика насквозь до внешнего края нужного ему этажа; `classic`/`classic-flow`/`cell` сохраняют короткую длину 4 px независимо от номера этажа.
    - DOM каждого этажа — `.label-level.label-level-N` плюс его семантические `classes`. Ключи элементов изолированы номером этажа, но повторяющийся текст внутри одного этажа всё ещё требует `keyForValue`. Размер текста измеряется общей probe-подписью, поэтому этажные классы рассчитаны на цвет и другие стили без изменения метрик шрифта.
    - `levelGap` задаёт вертикальный промежуток этажей. `slotSize: 'auto'` следует за текущим победителем, `'stable'` только увеличивает однажды увиденную высоту/ширину, `'max-candidate'` по X сразу резервирует высоту под максимальное число этажей среди кандидатов, число фиксирует размер в пикселях.
- **`defs/`** — SVG defs: градиенты, клипы, маски, паттерны и кроссбраузерный `ChartShadowFilter`. Фильтр строит тень из базовых SVG-примитивов, применяется к плоту через `.filterBy(filter)` или к отдельному SVG-элементу через `.apply(element)` и снимается парным `.remove(element)`. `updateOptions` принимает частичный апдейт: неуказанные `opacity`, `strength`, смещение и остальные настройки сохраняются.
- **`interaction/`** — интерактивность (устройство и композиция — в отдельном разделе «Интерактив» ниже):
  - `baseInteractionController/` — базовый контроллер и **конечный автомат** ввода (`StateMachine.ts`, состояния в `states/`: mouse hover/pan, touch hover/pan/zoom, ожидание распознавания жеста). Переходы отдаёт `controller.onStateChanged` — опрос по кадрам их пропускает, переход бывает короче кадра. Событие без полезной нагрузки: новое состояние читается из `controller.currentState` (типизировать событие по параметру машины нельзя — поле `EventEmitter<S>` сделало бы `StateMachine` инвариантной по `S`). Опознавать состояние — через `instanceof`: `constructor.name` не переживает минификацию.
  - `core/` — resolver-граф selections: identity/geometry/hit/кадр с memo-кешем, immutable-операции (`union`, `nearest`, `topmost`, `within`, `orElse`, `withInput`).
  - `composable/InteractionController.ts` — составной контроллер из `InteractionComponent`: hover-эффектов (`Highlight`, `VerticalLine`/`HorizontalLine`, `VerticalArea`/`HorizontalArea`, `MarkerOverlay`, `ChartTooltip`), управления viewport (`ZoomChartComponent`) и `CallbackComponent` — единственного способа подписаться на жесты снаружи. `updateOptions` есть у всех перечисленных, так что опции меняются на лету, без пересборки набора. `addComponent`/`removeComponent` работают и посреди активного ховера: снятый компонент убирает свой DOM в `detach`, добавленный сразу получает текущий ховер. `detach()` самого контроллера не уничтожает его состав: при повторном `attach()` компоненты подключаются снова. Визуальные эффекты и `ZoomChartComponent` принадлежат одному контроллеру за раз; `HoverSynchronizer` намеренно допускает несколько.
  - `BarInteractionSource.ts`, `AutoLineInteractionSource.ts`, `AutoMarkersInteractionSource.ts`, `PolygonAreaInteractionSource.ts` — источники запросов, каждый привязан к своему плоту: `bar.interaction`, `line.interaction`, `scatter.interaction`, `polygon.interaction`.
- **`ChartRenderManager.ts`**, `BaseChart.ts` — базовая инфраструктура рендера.

### Уровни тиков кадра и адаптивная временная иерархия

Подписи и тики связаны одним значением — **уровнями тиков кадра**. `BaseLabels.calculateLabelsFrame()` возвращает `LabelsFrame = { levels, tickLevels }`, а `render()` атомарно публикует уровни тиков наружу (`getTickLevels()`). Пробный `getSize()` может рассчитать кадр, чтобы узнать число этажей или ширину текста, но не публикует его `tickLevels`: наружу не должны попадать промежуточные примерки лейаута. Пустые bounds или отсутствие победителя дают пустой список — старые значения не остаются. Наружу отдаётся **только то, что читает рендерер тиков**: ни победившего кандидата, ни стратегии там нет — диагностику стенд добывает своими средствами, в контракт движка она не просачивается.

```ts
type LabelTickLevel = { values: readonly number[], classes?: Classes, suggestedStart: number }
```

Уровни задаёт **победивший label-кандидат** своим полем `ticks` — одним источником или списком от сильного к слабому:

```ts
type TickSource =
  | 'labels'                                    // значения подписей этого же кандидата
  | ValueGenerator
  | { gen: ValueGenerator | 'labels', minPixelSpacing?: number, from?: number, to?: number, classes?: Classes }

ticks?: TickSource | readonly TickSource[]
```

Источник значений — тот же канонический `ValueGenerator` (`steppedGenerator`, `arrayGenerator` или свой, например календарный) плюс шорткат `'labels'`, чтобы не дублировать генератор подписей. Отдельный уровень получается на каждый элемент списка, `classes` — из его же настроек. Скрытый уровень остаётся в списке с пустым `values`: иначе порядковые номера (а с ними и классы) поехали бы на следующем кадре.

- `ticks` не задан — берётся `['labels']`: тики ровно по подписям, как было до появления уровней. `[]` — тиков нет совсем.
- Уровень `'labels'` берёт значения своего этажа и его же `suggestedStart` (внешний край этажа у `interval`, `4` у остальных); у дополнительных генераторных уровней `suggestedStart: 0`. У `interval` в значения попадают семантические границы отрезков **вместе с замыкающей** (подписи на ней нет, а разделитель нужен); у остальных стратегий — значения до отсечения по краям (`onlyFitted` режет только подписи). При `onlyFitted: false` подписи, которые целиком не попали в `overflow`, получают класс `.label-outside-space` и остаются в DOM — его можно скрывать или анимировать стилями. Независимо от настроек подпись получает `.value-outside-bounds`, когда связанные с ней данные находятся за текущими границами графика: само значение у `classic`/`classic-flow`, весь отрезок у `interval` или вся ячейка `[v, v + size]` у `cell`.
- `minPixelSpacing` — порог плотности в пикселях лейаута. Он **уровневый**: если хоть одна пара соседних значений теснее порога, уровень скрывается целиком. Прореживать семантический набор движок не станет — у нерегулярного источника (`arrayGenerator`) один плотный участок гасит весь уровень, и это осознанно: выбрасывать часть календарных дат — решение страницы, а не движка. Порог считается по полному сгенерированному набору до дедупликации в рендерере.
- `from`/`to` источника по умолчанию наследуются от кандидата (те же лимиты оси); значения генерируются только для видимого диапазона и ограничены 500 штук на уровень за кадр.
- **Дедупликация происходит в `TicksByLabels` непосредственно перед отрисовкой.** При точном совпадении значений линию забирает уровень с наибольшей фактической длиной `start`, поэтому один interval-тик проходит до самого дальнего нужного этажа. При одинаковой длине побеждает более ранний уровень. Близкие, но не равные значения не снапятся и остаются отдельными линиями.

**Наследование настроек уровней:** `ticks === undefined` у первого этажа кандидата — берётся общий `options.ticks`, свой список заменяет общий целиком (merge по индексам нет); следующие этажи по умолчанию получают тики по собственным подписям. `steppedOverrides` дописывает в хвост 10 удвоений последнего шага **начиная с ×2**, и хвост наследует все нормализованные настройки последнего явного уровня — формат, стратегию, `ticks` и `classes`; меняется только шаг.

**`TicksByLabels` — один `PlotRenderer` на всю иерархию.** Внутри — приватный рендерер на уровень со своим кэшем линий; слабые уровни лежат в DOM раньше, нулевой последним, чтобы он был сверху. Смена числа уровней не требует пересоздания: группы переиспользуются, лишние удаляются, устаревшие динамические классы снимаются. На группе уровня одновременно живут порядковые служебные классы, семантические из расчёта и настроечные из опций:

```
.tick-level.tick-level-1.day-ticks.secondary-grid              // дни отдельным уровнем
.tick-level.tick-level-0.label-ticks.day-ticks.primary-grid    // те же дни как уровень подписей
```

`.label-ticks` движок добавляет сам всем уровням, которые построены по подписям своего этажа, — это факт «под этими тиками есть текст», а не порядковый номер. Отсюда правило для стилей страницы: **цвет единицы** задавать через `.day-ticks` / `.week-ticks` / `.hour-ticks`, а **силу порядка** — через `.tick-level-N`. Тогда день выглядит днём независимо от того, на каком он сейчас уровне.

```ts
const dayTicks: TickSource = { gen: steppedGenerator({ step: DAY }), minPixelSpacing: 5, classes: 'day-ticks' }

values: steppedOverrides({ step: [
  { step: DAY, labelForValue: v => `${1 + v / DAY} день`, ticks: [{ gen: 'labels', classes: 'day-ticks' }, hourTicks] },
  { step: WEEK, labelForValue: v => `${1 + v / WEEK} неделя`, ticks: [{ gen: 'labels', classes: 'week-ticks' }, dayTicks, hourTicks] },
]})

new TicksByLabels(labelsX, { classes: 'time-grid', levels: [{ classes: 'primary-grid' }, { classes: 'secondary-grid' }] })
```

Корневые `start`/`end` у `TicksByLabels` считаются настройками нулевого уровня; у прочих уровней свои — в `levels[i]`. `TicksByValues` остаётся для независимых статических значений (свой список чисел, не связанный с подписями), но для адаптивной временной иерархии он больше не нужен — раньше им вручную рисовали дни в лидерборде Натиска и на дневном графике. Стенд со всеми переходами — `/debug/chart/axis`, секция «Уровни тиков».

### Интерактив: контроллер, selections и эффекты

Никакого централизованного хит-теста нет: каждый плот сам знает свою геометрию и отдаёт **source** — точку входа для типизированных запросов. `InteractionController` (`interaction/composable/InteractionController.ts`) данные не хранит и ближайшие точки не ищет — он только прогоняет список `InteractionComponent` через два прохода кадра и владеет controller-owned local input (курсор/тач конкретно этого графика). Полный живой стенд со всеми случаями ниже — `/debug/chart/interaction`.

#### Controller добавляется последним

`InteractionController` — обычный плот с точки зрения `UniversalChart.addPlot()`, и место в композиции значимо: он должен идти **после** всех data-плотов.

```ts
chart
  .addPlot(plotRoot, 'plot')       // Bar/AutoLine/AutoMarkers/PolygonArea уже отрисовались в этом кадре
  .addPlot(interactionController)  // на его render() SVG и layout-кеши плотов соответствуют текущему кадру
```

Если контроллер окажется раньше, source в его кадре увидит геометрию **прошлого** кадра — устаревшие layout-прямоугольники Bar, вчерашний путь линии и т.д. Инвариант не проверяется рантаймом, его держит порядок вызовов `addPlot`; и `detail/Charts.ts` (боевой), и весь debug-стенд (`interaction/shared/chartScaffold.ts`) следуют ему явно и с комментарием на месте.

`InteractionController` **не** наследует space-hash short-circuit `BasePlotRenderer.render()` и выполняет свои interaction-фазы в каждом кадре, даже если сам `ChartSpace` не менялся: `setPoints`/`setData`/`setMarkers` планируют кадр чарта, но не помечают контроллер грязным. Иначе смена данных при неподвижном курсоре оставляла бы Highlight-классы и тултип от прошлого набора.

#### Два прохода кадра

`InteractionController.onRender()` строит `InteractionFrame` (`core/InteractionFrame.ts`) и прогоняет снимок списка компонентов дважды:

```ts
for (const component of components) component.prepareInteraction?.(frame)
for (const component of components) component.renderInteraction?.(frame)
```

`prepareInteraction` разрешает selections в immutable hits и не трогает DOM; `renderInteraction` делает class diff, обновляет SVG и вызывает внешние callbacks. Барьер между фазами снимает зависимость от порядка `addComponent()`: `ChartTooltip`, добавленный раньше `Highlight`, всё равно видит его `snapshot` того же кадра — снимок читается только в чужой `renderInteraction`, когда prepare уже отработал у всех.

`InteractionFrame.resolve(resolver, input)` мемоизирует результат по паре `(resolver instance, input)`, а не по одному resolver: иначе `withInput()` (разбор — ниже, в «Интерактив → Hover sync через input-bound selections»), резолвящий того же родителя под другим input, отравил бы local-ветку synced-результатом — один и тот же resolver в одном кадре может законно вернуть разные hits под разными input. Кеш живёт один кадр и не хранится в контроллере между кадрами.

#### Source → selection → effect

Каждый поддержанный плот выставляет `readonly interaction`: `bar.interaction`, `line.interaction`, `scatter.interaction`, `polygon.interaction`. Source знает только осмысленные для этого плота запросы и возвращает не готовые хиты, а **selection** — immutable resolver-узел; сам запрос выполняется только внутри кадра, в момент `frame.resolve()`.

```ts
const barItem = bar.interaction.contains({ gaps: 'miss', groupGaps: 'nearest' }) // BarItemSelection, 0..1 хит
const barGroup = barItem.related('group')                    // все item той же категории
const barDataset = barItem.related('dataset')                // все item того же датасета

const lines = lineA.interaction.union(lineB.interaction)     // source union — только между совместимым query API
const linePointsByX = lines.nearestByAxis('x')
const lineNearStroke = lines.nearStroke({ maxDistance: 6 }).nearest()

const scatterPoint = scatter.interaction.nearestPoint({ maxDistance: 8 })
const hoveredPolygon = polygon.interaction.contains().topmost()
```

Общие операции (`core/Selection.ts`) работают с любым `InteractionResolver`: `union()` — сохраняет порядок, при дубликате identity содержимое побеждает у правой стороны, а позиция остаётся от первого вхождения (это держит порядок строк тултипа стабильным при добавлении ещё одного `union()`); `nearest()` — минимальная `distance`, при точном равенстве побеждает более поздний по selection order; `topmost()` — последний hit selection order, а не DOM paint order; `within({ maxDistance })` — фильтр по правилу `contains || distance <= maxDistance`; `orElse()` — fallback, не union: обе стороны никогда не показываются одновременно; `withInput()` — переключение input для hover sync (разбор — ниже, в «Интерактив → Hover sync через input-bound selections»). `related()` — plot-specific и типизирован: `BarItemSelection.related()` принимает только `'group' | 'dataset'`, произвольная строка — ошибка сборки, а не пустой результат в рантайме.

`bar.interaction.contains({ gaps?, groupGaps?, hitArea? })` и `bar.interaction.containsGroup({ groupGaps?, hitArea? })` принимают две независимые gap-политики: `gaps` управляет промежутками между bar внутри группы (по умолчанию `'nearest'`), а `groupGaps` — промежутками между группами (по умолчанию `'miss'`, прежнее поведение). При `groupGaps: 'nearest'` ячейка категории целиком относится к своей группе, поэтому граница выбора соседей проходит посередине межгруппового промежутка. `hitArea: 'geometry' | 'vertical'` (по умолчанию `'geometry'`) управляет вертикальной зоной попадания. `'vertical'` растягивает её на всю высоту layout: наводить можно выше и ниже бара, X-диапазон не меняется. У grouped это работает на обоих уровнях — сам `contains()` расширяется по вертикали не хуже `containsGroup()`; у stacked сегменты одной категории делят общий X-диапазон, поэтому `contains()` у stacked `hitArea: 'vertical'` не отличается от `'geometry'` — сегменты остаются item'ами только по реальной геометрии, а вертикаль работает исключительно через `containsGroup()`. `BarItemHit<TCategory, TBarDatum>` возвращает исходный `datum`, нормализованный числовой `value`, `category` и оба индекса. `containsGroup()` — `0..1` group-level запрос: identity `kind: 'group'` с ключом-категорией, `datum` — сырые datum категории по всем датасетам, `category` — исходная категория, `targets` — все bar path категории, geometry — `groupRect` (в `'vertical'` — с Y-диапазоном на весь layout).

Один и тот же selection можно скормить нескольким эффектам сразу — они читают его через общий frame cache, повторного запроса не происходит:

```ts
new VerticalLine({ selection: linePointsByX })
new MarkerOverlay({ selection: linePointsByX, classesForHit: hit => hit.source === lineA.interaction ? 's0' : 's1' })
new ChartTooltip({ selection: linePointsByX.union(barGroup).union(scatterPoint).union(hoveredPolygon) })
```

Пример — сборный акцептанс-график стенда, `src/pages/debug/pages/chart/interaction/shared/MixedChart.ts`: там же `barItem` разом идёт в `Highlight` и в `VerticalArea({ geometry: 'group' })`, а `scatterPoint` — в `Highlight`, `VerticalLine`, `HorizontalLine` и в heterogeneous union тултипа.

Результат резолва — типизированный `InteractionHit<TDatum, TKind, TGeometryScope>` (`core/InteractionHit.ts`): `datum` — точное исходное значение пользователя, не нормализованная копия рендерера; `identity`/`memberships` — для дедупликации в `union()` и для highlight-сопоставления; `geometry`/`geometryFor(scope)` — layout-пиксели текущего кадра; `distance`/`contains` — общая метрика для `.nearest()`/`.within()`; `targets` — реальные SVG-элементы для class diff. Identity сравнивается как тройка `(sourceId, kind, key)`; `key` — только `string | number | symbol` и должен детерминированно повторяться при повторном создании той же логической identity. `kind` хита — discriminant (`'line-point'`, `'line-stroke'`, `'bar-item'`, `'bar-group'`, `'scatter-point'`, `'polygon'`, `'cursor'`). Конкретный тип `datum` сохраняется через всю цепочку query → `union()` → `ChartTooltip`.

Эффекты (`composable/components/`) реализуют `prepareInteraction`/`renderInteraction`, принимают `selection` в опциях и сами ничего не запрашивают:

- **`Highlight`** — один универсальный класс без `BarHighlight`/`LineHighlight`-подклассов: `prepare` строит снимок текущих `hit.targets`, `render` делает diff с предыдущим набором и адресно навешивает/снимает опциональный CSS-класс. `onHighlight(target)` / `onDehighlight(target)` вызываются на тех же переходах и позволяют применить к SVG-таргету эффекты вроде усиленного `ChartShadowFilter`; `onDehighlight` также вызывается при `updateOptions` и `detach`. Конфликт двух `Highlight` на одном классе, атрибуте или таргете — ответственность вызывающего, арбитража в движке нет.
- **`VerticalLine`/`HorizontalLine`** (`components/lines/`) — set semantics: одна линия на уникальную координату (`geometry.anchor.x`/`.y`), разные координаты дают несколько линий.
- **`VerticalArea`/`HorizontalArea`** (`components/areas/`) — то же на `xRange`/`yRange`; опция `geometry` выбирает именованный scope хита (например `'group'` у Bar), сама область не считает bar layout и не строит polygon bounds — это делает плот.
- **`MarkerOverlay`** (`components/markerOverlay/`) — один SVG-маркер на уникальный anchor selection, `classesForHit(hit)` задаёт стилизацию вызывающий, классы исходного плота не копируются автоматически.
- **`ChartTooltip`** (`components/chartTooltip/`) — публикует `TooltipCtx`, сам ничего не рисует (см. «TooltipCtx и highlights» ниже).

#### Минимальный пример: hover и тултип на одном графике

Без sync между графиками сборка короче — источник, selection и три эффекта на общем `InteractionController`. Корень контроллера по умолчанию получает класс `interaction`; первый аргумент `classes` (та же сигнатура, что у любого `BasePlotRenderer`) нужен только для дополнительных или альтернативных классов и остаётся стилевым хуком, а не режимом работы.

```ts
const line = new AutoLine({ classes: 'main-line' })
const plotRoot = new PlotGroup().addPlot(line)

const points = line.interaction.nearestByAxis('x')

const controller = new InteractionController()
  .addComponent(new VerticalLine({ selection: points }))
  .addComponent(new MarkerOverlay({ selection: points, classes: 'markers' }))
  .addComponent(new ChartTooltip({
    selection: points,
    onPositionChange: ctx => tooltipCtx.value = ctx,
    onHide: () => tooltipCtx.value = null,
  }))

chart
  .addPlot(plotRoot, 'plot')
  .addPlot(controller)  // после data-плотов, см. «Controller добавляется последним» выше
```

`tooltipCtx` дальше идёт во `HeaderTooltip.vue`/`FloatingTooltip.vue` через проп `:ctx` (см. «Вывод тултипов» ниже). Реальные варианты этой сборки без sync — `FrameChart.ts` и `LinePointsChart.ts` (`src/pages/debug/pages/chart/interaction/shared/`); композиция с `withInput()` для hover sync между графиками — следующий подраздел.

#### Hover sync через input-bound selections

`HoverSynchronizer` (`composable/sync/HoverSynchronizer.ts`) публикует не координату, а две роли раздельно и по-разному: значение вдоль **оси данных** (`dataAxisValue`) и долю вдоль **свободной оси** (`freeAxisFraction`, 0..1 от `space.layout` источника; конвертация — `ChartSpace.layoutToFractionY`/`fractionToLayoutY`), плюс `isTouch`. Не хиты и не selection. Ось данных синхронизируется значением, потому что у связанных графиков она обычно общая или сопоставимая по смыслу — то же значение означает ту же точку у любого фолловера. Со свободной осью так нельзя: у двух графиков она легко имеет разные шкалы (сотни против тысяч), и значение источника, прочитанное шкалой фолловера, может спроецироваться далеко за пределы его области построения. Доля от layout ни от чьих данных не зависит, поэтому у фолловера курсор всегда остаётся внутри его собственной области.

Какая ось данных, а какая свободная — решение движка, а не факт хаба: сейчас это всегда X/Y (горизонтальных графиков нет, `nearestByAxis('y')` нигде не используется), и соглашение целиком лежит в паре `project()`/`unproject()` внутри `HoverSynchronizer` — единственном месте, которое его знает. У вертикального графика датапоинт лежит по данным на Y, а свободная ось — X, поэтому ось данных должна стать свойством самого графика (участвует в layout, hit-геометрии, `related`), а не настройкой хаба: одна и та же пара «источник/фолловер» может синхронизировать разные оси, и подмена входит в силу только когда `project()` берёт ось из `ChartSpace` источника, а `unproject()` — из `ChartSpace` фолловера.

Синхронизируется точка, а не результат запроса: каждый график резолвит её против собственных данных, поэтому gap на одном графике при datum в той же точке на другом — ожидаемый результат, а не рассинхрон.

```ts
const localPoints = line.interaction.nearestByAxis('x')
const syncedPoints = localPoints.withInput(sync.hover)   // тот же resolver, другой input

new VerticalLine({ selection: syncedPoints })    // линия синхронная — видна на всех связанных графиках
new MarkerOverlay({ selection: localPoints })    // маркер — только по локальному ховеру этого графика
```

`withInput(hoverSync)` (`core/Selection.ts`, `WithInputSelection`) на каждый resolve выбирает: если у контроллера, которому принадлежит текущий кадр, есть local pointer — резолвит родителя им (**local hover приоритетнее**); иначе резолвит родителя под synced input, чью точку уже в пикселях этого графика отдаёт `hoverSync.resolve(space)` — ось данных ищется по значению в этом `ChartSpace`, свободная восстанавливается из доли layout источника, обе проекции происходят внутри самого `resolve()`, `WithInputSelection` берёт результат как есть. Выбранный effective input пробрасывается через последующие `within()`/`nearest()`/`topmost()`/`orElse()` и через `union()`, если у его ветвей нет конфликта input, поэтому `withInput()` не обязан быть последним оператором перед `ChartTooltip`. `cursorSelection()` (`core/cursorSelection.ts`) даёт ту же модель для «курсорной линии без данных»: один `'cursor'` hit с `distance: Infinity`, чтобы не побеждать ни в одном `.nearest()`/`tooltipPivot: 'nearest'`; типичный fallback-паттерн — `linePointsByX.within({ maxDistance: 20 }).orElse(cursorSelection())`.

Боевой пример — `detail/Charts.ts`:

```ts
const syncedPoints = this.line.interaction.nearestByAxis('x').withInput(sync.hover)

this.interactionController = new InteractionController()
  .addComponent(new VerticalLine({ selection: syncedPoints, offset: { end: 0.5, start: -5 } }))
  .addComponent(new MarkerOverlay({ selection: syncedPoints, /* ... */ }))
  .addComponent(new ChartTooltip({ selection: syncedPoints, tooltipPivot: 'avg', /* ... */ }))
  .addComponent(sync.hover)
```

Здесь синхронизированы все три эффекта, но выборочность — вопрос композиции: не оборачивая selection конкретного эффекта в `withInput()`, легко оставить его local-only (ровно так `MixedChart.ts` и debug-секция «Selective hover sync» демонстрируют разные комбинации). Сам `HoverSynchronizer` также добавляется в `InteractionController` как обычный `InteractionComponent` (`addComponent(sync.hover)`) — так он получает `onHoverBegin/Update/End` этого графика и публикует координату остальным.

#### TooltipCtx и highlights

`ChartTooltip` не создаёт HTML — публикует typed `TooltipCtx<THit>` через `onShow`/`onPositionChange`/`onHide`. Пустой selection вызывает `onHide`, поэтому опубликованный `ctx.hits` типизирован как непустой tuple и идёт ровно в порядке `selection` (тултип ничего не сортирует), а `ctx.hit` без nullable равен `ctx.hits[0]`. `ctx.pivot` зависит от `tooltipPivot` (`'cursor' | 'nearest' | 'avg'`, по умолчанию `'cursor'`) и влияет только на позиционирование, не на состав hits.

`exposeHighlights: Highlight[]` — список инстансов, чей snapshot тултип публикует в `ctx.highlights`, в порядке этого массива опций. Снимок гарантированно того же кадра независимо от того, что раньше стоит в `addComponent()` — `Highlight` или `ChartTooltip`: `renderInteraction` тултипа читает `highlight.snapshot`, который к этому моменту уже посчитан в чужой `prepareInteraction` (двухфазный барьер выше).

```ts
const isLineHighlighted = ctx.isHighlighted(hit, chart.lineHighlight)
```

`ctx.isHighlighted(hit, highlight)` сопоставляет направленно: hit подсвечен, если его `identity` или любой из `memberships` совпадает с identity одного из hits в snapshot этого `Highlight` — не пересечением DOM-таргетов. Поэтому точка линии оказывается highlighted, когда подсвечена её серия (через membership point → series), а подсветка одной точки не делает highlighted всю серию. `Highlight`, не попавший в `exposeHighlights`, даёт `false`, а не исключение.

`TooltipCtx` **переживает кадр**: `FloatingTooltip.vue` держит последний непустой `ctx` во время анимации скрытия, поэтому `hits`/`highlights`/`isHighlighted()` — самодостаточный immutable снимок без ссылок на `InteractionFrame` или его memo-кеш. Правило «hits живут один кадр» — про запрет пере-resolve вне кадра, а не про то, что готовый опубликованный снимок нельзя удерживать дольше самого кадра.

### ZoomChartComponent — зум/пан/инерция

`interaction/composable/components/zoomChartComponent/` — пан мышью/тачем, зум колесом и пинчем, инерция, «резиновые» лимиты. **Есть подробный `readme.md` прямо в папке** — обязательно читай его перед изменениями; там же список неочевидных решений с пометкой «не чинить». Компонент завершён, автор просил не закладывать в него архитектуру «на будущее». Боевое место использования одно: `src/pages/infographics/pages/onslaught/leaderboard/components/detail/Charts.ts`; плюс стенд со всеми настройками — `/debug/chart/interaction` (см. выше).

### Связка графиков (hover / bounds sync)

`interaction/composable/sync/` — синхронизация нескольких `UniversalChart` по принципу **координатный фрейм ≠ viewport**: примитив синка не зависит от зума, а каждый график сам проецирует его в свои пиксели и снапит/фитит по **своим** данным. Для `HoverSynchronizer` это устроено по-разному для двух ролей — ось данных живёт в chart-space (значение), свободная ось — в доле layout источника (подробности, включая текущее соглашение «ось данных — это X», — выше, «Hover sync через input-bound selections»), — но обе одинаково не зависят от чужого зума. Два независимых хаба (можно включать по отдельности), оба создаются один раз в `Detail.vue` и передаются в компоненты:

- **`HoverSynchronizer`** (hover-sync): навёл на один график — hover зажигается на всех связанных в той же точке фрейма. Добавляется в каждый `InteractionController` как `InteractionComponent` (`addComponent`), а как источник точки (`HoverResolver`) подключается к конкретным selections через `.withInput(sync.hover)` — синхронизируются обе роли осей и `isTouch`, не хиты; локальный hover приоритетнее внешнего. Композиция и пример разобраны выше, в «Интерактив → Hover sync через input-bound selections».
- **`BoundsSynchronizer`** (bounds-sync): зазумил/пропанил один — связанные синхронно повторяют окно ведущей оси (направление как у `panDirection`: `new BoundsSynchronizer('horizontal' | 'vertical' | 'all')`), каждый анимируя свою auto-fit ось. Передаётся в `ZoomChartComponent` опцией `boundsSync`. **Идёт через `ZoomChartComponent`**, а не через `chart.setRenderBounds` напрямую (иначе auto-fit ось ведомого снапит — детали в его `readme.md`).

Референс проводки — `detail/Charts.ts` + `detail/Detail.vue` (лидерборд Натиска). Статичный сезонный вариант без зума с постоянными маркерами точек — `onslaught/general/dailyPlayersChart/`.

### Вывод тултипов (`src/shared/ui/chart/`)

`ChartTooltip` ничего не рисует — публикует наружу `TooltipCtx` (hits в порядке selection, snapshot заказанных `exposeHighlights` с `isHighlighted()`, координаты pivot/курсора в клиентских и абсолютных координатах, бокс графика — контракт разобран выше, в «Интерактив → TooltipCtx и highlights»). Как это показать — дело Vue-обёрток; их две, обе принимают `:ctx="chart.tooltipCtx.value"`:

- **`HeaderTooltip.vue`** — тултип в шапке графика: слоты `left`/`center`/`right` (заголовок, селекторы) и `tooltip`, который едет по горизонтали за точкой и прячет пересекающиеся элементы шапки.
- **`FloatingTooltip.vue`** — плавающий тултип поверх страницы. Своей разметки нет: это `PopoverStyled` (`shared/uiKit/popover`), у которого `interactive` по умолчанию `false` (но его можно включить), поэтому бесплатно достаются общий контейнер поповеров, флип у краёв экрана, стрелка, карточка и анимация. Целью выступает `VirtualElement` — прямоугольник считается из абсолютных координат `ctx` минус текущий скролл, без промежуточного элемента в DOM, поэтому тултип остаётся приклеенным к точке и при скролле страницы без перерисовки графика. Проп `anchor`: `pivot` (точка, по умолчанию), `cursor`, `pivot-x` / `pivot-y` (якорь-линия во всю высоту/ширину графика — тултип встаёт сбоку). Дальше пробрасываются `placement`, `offset`, `viewportOffset`, `arrowSize`, `class`; по умолчанию тултип не перехватывает указатель (`interactive`). `hideDelay` задерживает начало скрытия и отменяется, если `ctx` снова появился. Во время задержки и анимации скрытия контент остаётся от последнего непустого `ctx`, поэтому слот всегда получает непустой `ctx`.

  По умолчанию переход между точками мгновенный; проп `animated` включает плавный (скорость — `animationOmega`, выше = резче). Сглаживается **цель**, а не позиция поповера: `CriticalFollower` ведёт прямоугольник цели, а поповер каждый кадр заново считает от него placement, прижатие к краям и стрелку — поэтому промежуточные кадры остаются корректными, а скролл применяется мгновенно (вычитается уже после сглаживания). CSS-транзишен на контейнере такого не дал бы: он анимирует результат позиционирования и превращает скролл в резинку. Анимация сбрасывается на появлении тултипа (не на скрытии: во время анимации скрытия поповер ещё жив и продолжает опрашивать цель), иначе показ начинался бы с перелёта от прошлой точки.

### Пример использования

Смотри `detail/Charts.ts` (лидерборд Натиска) — там собран полный граф: чарт + оси + линии + ховер с тултипом + зум с лимитами + hover/bounds sync. Это лучший референс при создании нового графика на UniversalChart. Для полной матрицы механизмов интерактива (bar/scatter/polygon sources, Highlight, areas, композиция selections, кадр и инвалидация) — `/debug/chart/interaction`, там же лежит сборный acceptance-график со всеми плотами и эффектами разом (`shared/MixedChart.ts`).

## Когда что использовать

- Карточка со статичным распределением/долями → `MiniBar`/`MiniPie` (chart.js).
- Интерактивный таймсерийный график с зумом/тултипами → UniversalChart.
- Новую библиотеку графиков не добавлять.
