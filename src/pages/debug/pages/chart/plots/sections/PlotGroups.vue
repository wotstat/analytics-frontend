<template>
  <DebugSection title="Несколько рендереров и PlotGroup" id="plot-group"
    description="Шесть рендереров в одном графике: порядок отрисовки — это порядок добавления, границы — объединение всех getBounds. Справа настоящее дерево SVG: видно, как аргумент path раскладывает плоты по группам."
    source="src/shared/uiKit/chart/universalChart/utils/PlotGroup.ts">

    <div class="debug-row">
      <label class="debug-control" v-for="item in layers" :key="item.value">
        <span class="debug-label">{{ item.label }}</span>
        <input type="checkbox" v-model="enabled[item.value]">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">порядок</span>
        <select v-model="order">
          <option value="line-last">линия и маркеры сверху</option>
          <option value="bars-last">столбцы сверху</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">в PlotGroup</span>
        <input type="checkbox" v-model="grouped">
      </label>

      <label class="debug-control" v-if="grouped">
        <span class="debug-label">клип на группе</span>
        <input type="checkbox" v-model="clipped">
      </label>

      <label class="debug-control">
        <span class="debug-label">path</span>
        <select v-model="path">
          <option v-for="item in paths" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 320px" ref="host">
      <ChartStage :chart="chart" :height="260" />

      <div class="debug-log">
        <div class="debug-log-line" v-for="(line, index) in tree" :key="index">
          <span>{{ line }}</span>
        </div>
        <div class="debug-log-empty" v-if="tree.length === 0">дерево ещё не построено</div>
      </div>
    </div>

    <p class="debug-note">
      <b>Состав меняется на живом графике.</b> <span class="debug-value">removePlot</span> снимает рендерер: убирает
      его из списка, вынимает корневой элемент из DOM и зовёт <span class="debug-value">detach</span>. Ни одна галка
      здесь не пересоздаёт чарт — сам инстанс и его SVG живут всё время, меняется только набор плотов.
    </p>

    <p class="debug-note">
      <b>Что remove не убирает — это группы пути.</b> <span class="debug-value">addPlot(plot, 'plot')</span> создаёт
      <span class="debug-value">&lt;g class="plot"&gt;</span> и кеширует её. Сняли единственный плот из этой группы —
      сама группа останется пустой. Переключи path туда-обратно и найди в дереве осиротевшие
      <span class="debug-value">g</span>: на отрисовку они не влияют, но и не подчищаются.
    </p>

    <p class="debug-note">
      <b>Порядок = порядок добавления</b>, потому что SVG рисует в порядке DOM. Поменяй порядок и смотри, кто
      кого перекрывает. То же внутри PlotGroup: сначала добавленный уходит вниз.
    </p>

    <p class="debug-note">
      <b>path задаёт группу, а вместе с ней и базовые стили.</b> Стили движка написаны как
      <span class="debug-value">.plot .line</span> и <span class="debug-value">.plot .bar</span>, поэтому плот,
      добавленный без пути, остаётся без <span class="debug-value">fill: none</span> и без
      <span class="debug-value">stroke</span>: вместо линии получается чёрное залитое пятно. Выбери «без пути» и
      сравни. В пути можно указать несколько классов через точку и вложенность через
      <span class="debug-value">&gt;</span> — обе формы видно в дереве справа.
    </p>

    <p class="debug-note">
      <b>PlotGroup пробрасывает детям только render и getBounds.</b> beforeLayout, afterLayout и didLayout до
      вложенных плотов не доходят вообще — сегодня это не мешает (штатные рендереры данных этих хуков не
      используют), но новый рендерер с layout-хуком внутри группы молча перестанет работать. Клип и маска на
      группе, наоборот, накрывают всех детей одним элементом — это и есть основная причина её существования.
    </p>

    <p class="debug-note">
      <b>Границы — объединение.</b> Включи столбцы: bounds по Y обязательно захватят ноль (Bar всегда добавляет
      базовую линию), и вся картинка съедет. Выключи — вернётся диапазон линий, полигона и scatter-маркеров.
      Полигон участвует в bounds по умолчанию, для маркеров это явно включено через
      <span class="debug-value">affectsBounds: true</span>, а прямоугольная область оставлена с выключенным
      дефолтом.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onMounted, ref, useTemplateRef, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticBarDatasets, syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { ChartPoint } from '@/pages/debug/shared/fixtures/types'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { PolygonArea } from '@/shared/uiKit/chart/universalChart/plot/area/PolygonArea'
import { RectangleArea } from '@/shared/uiKit/chart/universalChart/plot/area/RectangleArea'
import { Bar } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { AutoLineArea } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineArea'
import { AutoMarkers } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers'
import { UniversalChart, type PlotRenderer } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import { afterRender } from '../shared/afterRender'

const layers = [
  { value: 'bars', label: 'столбцы' },
  { value: 'corridor', label: 'коридор' },
  { value: 'line', label: 'линия' },
  { value: 'markers', label: 'маркеры' },
  { value: 'area', label: 'область' },
  { value: 'polygon', label: 'полигон' },
] as const

const paths = [
  { value: 'plot', label: 'plot' },
  { value: 'none', label: 'без пути' },
  { value: 'nested', label: 'plot > overlay.top' },
] as const

const series = syntheticSeries('smooth', 11, 24).filter((point): point is ChartPoint => point !== null)
const bars = syntheticBarDatasets(2, 24, 9)

const enabled = ref<Record<typeof layers[number]['value'], boolean>>({
  bars: true,
  corridor: true,
  line: true,
  markers: true,
  area: true,
  polygon: true,
})

const order = ref<'line-last' | 'bars-last'>('line-last')
const grouped = ref(true)
const clipped = ref(false)
const path = ref<typeof paths[number]['value']>('plot')

const host = useTemplateRef<HTMLElement>('host')
const tree = ref<string[]>([])

const clip = new ChartClip('center', { top: -1, bottom: -1 })

const chart = markRaw(new UniversalChart({
  renderManager: globalChartRenderManagerSteps4,
  renderBoundsPadding: { vertical: 20 },
  minLayoutSize: 6,
}).addDefs(clip))

// То, что сейчас висит на чарте верхним уровнем: либо группа, либо сами плоты.
let attached: PlotRenderer[] = []

function apply() {
  for (const plot of attached) chart.removePlot(plot)
  attached = []

  const bar = new Bar({
    strategy: { type: 'stacked', padding: 0.4, radius: 2, innerPadding: 1 },
  }).setDatasets(bars.map((dataset, index) => ({
    classes: index === 0 ? 'series-d' : 'series-e',
    values: dataset.values.map(value => value * 4),
  })))

  const corridor = new AutoLineArea({
    classes: ['corridor', 'series-c', 'solid-area'],
    smoothingMethod: 'monotone',
  }).setPoints(
    series.map(point => ({ x: point.x, y: point.y + 90 })),
    series.map(point => ({ x: point.x, y: point.y - 90 })),
  )

  const line = new AutoLine({
    classes: ['main-line', 'series-a'],
    smoothingMethod: 'monotone',
  }).setPoints(series)

  const markers = new AutoMarkers({
    classes: ['markers', 'series-a'],
    size: 3,
    maskSize: 0,
    affectsBounds: true,
  })
    .setMarkers(series)

  const area = new RectangleArea(['rect-area', 'series-b'], { layoutLimited: true })
  area.setPoints({ x: 14, y: -Infinity }, { x: 20, y: Infinity })

  const polygon = new PolygonArea(['background-polygon', 'series-c'])
  polygon.setPoints([
    { x: 2, y: 260 },
    { x: 5, y: 430 },
    { x: 8, y: 310 },
    { x: 7, y: 170 },
    { x: 3, y: 150 },
  ])

  const plots: PlotRenderer[] = []
  if (enabled.value.polygon) plots.push(polygon)
  if (enabled.value.area) plots.push(area)
  if (enabled.value.bars) plots.push(bar)
  if (enabled.value.corridor) plots.push(corridor)
  if (enabled.value.line) plots.push(line)
  if (enabled.value.markers) plots.push(markers)

  if (order.value === 'bars-last' && enabled.value.bars) {
    plots.splice(plots.indexOf(bar), 1)
    plots.push(bar)
  }

  const target = path.value === 'none' ? [] : path.value === 'plot' ? ['plot'] : ['plot', 'overlay.top']

  if (grouped.value) {
    const group = new PlotGroup(['demo-group'])
    for (const plot of plots) group.addPlot(plot)
    if (clipped.value) group.clipBy(clip)
    chart.addPlot(group, target)
    attached = [group]
  } else {
    for (const plot of plots) chart.addPlot(plot, target)
    attached = plots
  }

  afterRender(chart, dumpTree)
}

watch([enabled, order, grouped, clipped, path], () => apply(), { deep: true, immediate: true })

onMounted(() => afterRender(chart, dumpTree))

function dumpTree() {
  const svg = host.value?.querySelector('svg')
  if (!svg) return

  const lines: string[] = []
  walk(svg, 0, lines)
  tree.value = lines
}

function walk(element: Element, depth: number, lines: string[]) {
  if (lines.length > 40) return

  for (const child of Array.from(element.children)) {
    const classes = child.getAttribute('class')
    const suffix = classes ? `.${classes.trim().split(/\s+/).join('.')}` : ''
    lines.push(`${'· '.repeat(depth)}${child.tagName}${suffix}`)

    if (child.children.length > 0 && depth < 5) walk(child, depth + 1, lines)
    if (lines.length > 40) return
  }
}

</script>


<style scoped lang="scss">
:deep(.universal-chart-root) {
  .rect-area rect {
    fill: currentColor;
    fill-opacity: 0.12;
  }

  .background-polygon path {
    fill: currentColor;
    fill-opacity: 0.16;
    stroke: currentColor;
    stroke-width: 1.5;
  }

  .markers circle {
    fill: currentColor;
  }
}
</style>
