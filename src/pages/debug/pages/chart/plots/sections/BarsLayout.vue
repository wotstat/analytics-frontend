<template>
  <DebugSection title="Bar: grouped и stacked, padding, maxWidth" id="bar-layout"
    description="Столбец занимает координатную ячейку [i, i+1]. Тяни padding: до единицы это доля ячейки, с единицы — пиксели, и на границе картинка скачком меняется. Ноль и NaN не рисуются вообще, а не превращаются в нулевой столбец."
    source="src/shared/uiKit/chart/universalChart/plot/bar/Bar.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">strategy</span>
        <select v-model="type">
          <option value="grouped">grouped</option>
          <option value="stacked">stacked</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">датасетов</span>
        <input type="number" min="1" max="5" v-model.number="datasetCount">
      </label>

      <label class="debug-control">
        <span class="debug-label">категорий</span>
        <input type="number" min="1" max="60" v-model.number="categories">
      </label>

      <label class="debug-control">
        <span class="debug-label">значения</span>
        <select v-model="values">
          <option v-for="item in valueModes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">сид</span>
        <input type="number" min="1" max="99" v-model.number="seed">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">padding</span>
        <input type="range" min="0" max="2" step="0.05" v-model.number="padding">
        <span class="debug-value">{{ padding.toFixed(2) }}{{ padding < 1 ? ' (доля)' : ' px' }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">innerPadding</span>
        <input type="range" min="0" max="12" step="0.05" v-model.number="innerPadding">
        <span class="debug-value">{{ innerPadding.toFixed(2) }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">maxWidth</span>
        <input type="range" min="0" max="80" step="1" v-model.number="maxWidth">
        <span class="debug-value">{{ maxWidth === 0 ? 'не задан' : `${maxWidth}px` }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">radius</span>
        <input type="range" min="0" max="20" step="1" v-model.number="radius">
        <span class="debug-value">{{ radius }}</span>
      </label>
    </div>

    <div class="debug-row">
      <span class="debug-hint">ячейка: <span class="debug-value">{{ cellWidth }}px</span></span>
      <span class="debug-hint">столбец по факту: <span class="debug-value">{{ barWidth }}px</span></span>
      <span class="debug-hint">
        bounds: <span class="debug-value">
          x {{ formatNumber(space.bounds.minX, 0) }}…{{ formatNumber(space.bounds.maxX, 0) }},
          y {{ formatNumber(space.bounds.minY, 0) }}…{{ formatNumber(space.bounds.maxY, 0) }}
        </span>
      </span>
    </div>

    <ChartStage :chart="instance.chart" :height="260" />

    <p class="debug-note">
      <b>padding и innerPadding живут по правилу «меньше единицы — доля».</b> padding меньше единицы — доля ширины
      ячейки, от единицы — пиксели. У grouped то же самое с innerPadding, но доля считается хитрее: это доля
      промежутка в паре «столбец + промежуток», поэтому 0.5 даёт промежуток, равный столбцу. А вот у
      <b>stacked innerPadding всегда пиксели</b> — доли там нет, одинаковая цифра в двух стратегиях означает разное.
    </p>

    <p class="debug-note">
      Проверь вырожденные комбинации: padding больше ширины ячейки (много категорий + padding в пикселях) —
      столбцы схлопываются в ничто и пропадают целиком; innerPadding в пикселях больше группы — то же самое;
      maxWidth меньше пары пикселей — от столбца остаётся нитка, а радиус, если он больше половины ширины,
      молча ужимается.
    </p>

    <p class="debug-note">
      Нулевые значения и NaN <b>не рисуются вовсе</b> — не нулевой столбец, а отсутствие столбца. В stacked такое
      значение ещё и не занимает места в стопке, поэтому соседи съезжают вниз. Ноль всегда попадает в bounds:
      базовая линия не уезжает, даже если все значения одного знака и далеко от нуля.
    </p>

    <p class="debug-note">
      Ширина ячейки в пикселях считается из <span class="debug-value">layout.width</span> и bounds по X, а ширина
      столбца снята с готового SVG через getBBox — то есть это то, что реально нарисовано, а не то, что задумано
      настройками.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticBarDatasets } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { Bar, type BarDataset, type BarStrategy } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import { useChartInstance } from '../shared/useChartInstance'
import { formatNumber, useSpaceProbe } from '../shared/useSpaceProbe'
import { afterRender } from '../shared/afterRender'

const valueModes = [
  { value: 'positive', label: 'только положительные' },
  { value: 'signed', label: 'со знаком' },
  { value: 'holes', label: 'с нулями и NaN' },
] as const

const seriesClasses = ['series-a', 'series-b', 'series-c', 'series-d', 'series-e']

const type = ref<'grouped' | 'stacked'>('grouped')
const datasetCount = ref(3)
const categories = ref(12)
const values = ref<typeof valueModes[number]['value']>('positive')
const seed = ref(1)
const padding = ref(0.3)
const innerPadding = ref(0.15)
const maxWidth = ref(0)
const radius = ref(3)

const barWidth = ref('—')

const datasets = computed<BarDataset[]>(() => {
  const raw = syntheticBarDatasets(datasetCount.value, categories.value, seed.value)

  return raw.map((dataset, datasetIndex) => ({
    classes: seriesClasses[datasetIndex % seriesClasses.length],
    values: dataset.values.map((value, index) => transform(value, index, datasetIndex)),
  }))
})

const strategy = computed<BarStrategy>(() => {
  const base = {
    padding: padding.value,
    innerPadding: innerPadding.value,
    maxWidth: maxWidth.value,
    radius: radius.value,
  }

  return type.value === 'grouped' ? { type: 'grouped', ...base } : { type: 'stacked', ...base }
})

const { instance } = useChartInstance(build)
const space = useSpaceProbe(() => instance.value.chart)

const cellWidth = computed(() => {
  const { minX, maxX } = space.value.bounds
  if (maxX === minX) return '—'
  return (space.value.layout.width / (maxX - minX)).toFixed(1)
})

function build() {
  const bar = new Bar({ classes: 'bars', strategy: strategy.value })

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    minLayoutSize: 4,
  }).addPlot(bar, 'plot')

  return { chart, bar }
}

watchEffect(() => {
  const { chart, bar } = instance.value
  bar.setStrategy(strategy.value)
  bar.setData({ datasets: datasets.value })
  afterRender(chart, sample)
})

onMounted(() => afterRender(instance.value.chart, sample))

function transform(value: number, index: number, datasetIndex: number) {
  if (values.value === 'signed') return index % 3 === 1 ? -value : value
  if (values.value === 'holes') {
    if ((index + datasetIndex) % 5 === 0) return 0
    if ((index + datasetIndex) % 7 === 0) return NaN
  }
  return value
}

function sample() {
  const root = instance.value.bar.getRootElement()
  const bars = Array.from(root.querySelectorAll<SVGPathElement>('path.bar'))

  for (const bar of bars) {
    if (!bar.getAttribute('d')) continue
    barWidth.value = bar.getBBox().width.toFixed(1)
    return
  }

  barWidth.value = '—'
}

</script>
