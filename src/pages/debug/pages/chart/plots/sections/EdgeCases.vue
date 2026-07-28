<template>
  <DebugSection title="Крайние случаи: пустота, константа, ноль, ресайз" id="edge-cases"
    description="Пустой ряд, одна точка, константа и переход через ноль — на одном графике с линией и столбцами. Плюс ручные bounds, которыми график можно сломать нарочно, и ресайз контейнера за уголок."
    source="src/shared/uiKit/chart/universalChart/utils/Bounds.ts">

    <SeriesControls :state="data" hide-source />

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">renderBounds</span>
        <select v-model="boundsMode">
          <option v-for="item in boundsModes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">столбцы</span>
        <input type="checkbox" v-model="withBars">
      </label>

      <span class="debug-hint">высота:</span>
      <button class="debug-btn" v-for="item in heights" :key="item" :class="{ active: height === item }"
        @click="height = item">
        {{ item }}px
      </button>
    </div>

    <div class="debug-row" ref="readout">
      <span class="debug-hint">
        layout: <span class="debug-value">
          {{ formatNumber(space.layout.width) }} × {{ formatNumber(space.layout.height) }}
          @ {{ formatNumber(space.layout.x) }}, {{ formatNumber(space.layout.y) }}
        </span>
      </span>
      <span class="debug-hint">
        bounds: <span class="debug-value">
          x {{ formatNumber(space.bounds.minX) }}…{{ formatNumber(space.bounds.maxX) }},
          y {{ formatNumber(space.bounds.minY) }}…{{ formatNumber(space.bounds.maxY) }}
        </span>
      </span>
      <span class="debug-hint">d: <span class="debug-value">{{ path.length }}</span> симв.</span>
    </div>

    <ChartStage :chart="instance.chart" :version :height="height" resizable />

    <p class="debug-note">
      Тяни правый нижний угол графика: layout и все пути пересчитываются по ResizeObserver. Но при нулевой высоте
      или ширине рендер вообще не запускается — жми «0px» и смотри, что происходит при возврате: график
      перерисовывается с нуля, ничего не залипает. Отдельно проверь узкое окно браузера: страница не должна
      разъезжаться по горизонтали.
    </p>

    <p class="debug-note">
      <b>Пальцем:</b> уголок ресайза на тач-устройствах почти не поймать (и жест конфликтует со скроллом страницы) —
      проверяй ресайз поворотом экрана, ResizeObserver отработает так же. Само по себе рисование данных на тач
      ничем не отличается: обработчиков ввода у рендереров нет, вся интерактивность живёт на соседней странице.
    </p>

    <p class="debug-note">
      <b>Вырожденные данные движок вытягивает сам.</b> Пустой ряд — пустые bounds, пустой путь, ничего не
      нарисовано и никаких ошибок. Одна точка — сегмент дублируется во вторую такую же (иначе нечего соединять),
      а нулевая ширина bounds раздвигается на ±1. Константа — то же самое по вертикали: нулевая высота становится
      ±1, и линия садится ровно по центру.
    </p>

    <p class="debug-note">
      <b>А вот руками сломать можно.</b> Режим «нулевая высота» ставит minY = maxY: масштаб делится на ноль,
      координаты становятся Infinity, и не рисуется ничего — этой ситуации, в отличие от автофита, никто не
      проверяет. «Инвертированные X» (minX больше maxX) движок тоже не проверяет: масштаб становится
      отрицательным и график честно рисуется зеркально.
    </p>

    <p class="debug-note">
      <b>Infinity в setRenderBounds — это не «до бесконечности», а «отпусти ось».</b> Внутри есть отдельная
      проверка: бесконечная граница превращается в null, то есть ось возвращается в автофит. Режим «minX =
      -Infinity» это и показывает: ось ведёт себя как при автоматическом подборе. Ноль такой проверкой не
      затрагивается — он остаётся жёсткой границей.
    </p>

    <p class="debug-note">
      <b>Линия и столбцы стоят по-разному.</b> У столбца координатная ячейка <span class="debug-value">[i, i+1]</span>,
      у точки линии — сама <span class="debug-value">i</span>, поэтому линия проходит по левым краям столбцов, а не
      по их центрам. Это не баг рендерера, а разные системы отсчёта: в боевом коде точки для таких графиков сдвигают
      на полкапли (<span class="debug-value">i + 0.5</span>). Ещё столбцы всегда тянут в bounds ноль, поэтому от
      галки «столбцы» диапазон Y заметно меняется.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import type { ChartPoint } from '@/pages/debug/shared/fixtures/types'
import { RectangleArea } from '@/shared/uiKit/chart/universalChart/plot/area/RectangleArea'
import { Bar } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { AutoMarkers } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import SeriesControls from '../shared/SeriesControls.vue'
import { useChartInstance } from '../shared/useChartInstance'
import { useSeriesSource } from '../shared/useSeriesSource'
import { formatNumber, useSpaceProbe } from '../shared/useSpaceProbe'
import { afterRender, pathInfo, type PathInfo } from '../shared/afterRender'

const boundsModes = [
  { value: 'auto', label: 'авто (по данным)' },
  { value: 'zero-height', label: 'нулевая высота: minY = maxY' },
  { value: 'inverted', label: 'инвертированные X: minX > maxX' },
  { value: 'half', label: 'только minX' },
  { value: 'infinite', label: 'minX = -Infinity' },
] as const

const heights = [0, 80, 240, 400] as const

const data = useSeriesSource('negative', 60)

const boundsMode = ref<typeof boundsModes[number]['value']>('auto')
const withBars = ref(true)
const height = ref<number>(240)

const readout = useTemplateRef<HTMLElement>('readout')
const path = ref<PathInfo>({ length: 0, curves: 0, lines: 0, moves: 0 })

const barValues = computed(() => data.series.value.map(point => point ? point.y / 2 : 0))

const { instance, version, rebuild } = useChartInstance(build)
const space = useSpaceProbe(() => instance.value.chart, () => readout.value)

function build() {
  const line = new AutoLine({ classes: ['main-line', 'series-a'], smoothingMethod: 'monotone' })
  const markers = new AutoMarkers({ classes: ['markers', 'series-a'], size: 3, maskSize: 0 })
  const bar = new Bar({ strategy: { type: 'grouped', padding: 0.4, radius: 2 } })

  // Нулевая линия: прямоугольник нулевой высоты с отрицательным padding даёт полоску в 1px.
  const zero = new RectangleArea('zero-line', { layoutLimited: true, padding: { top: -0.5, bottom: -0.5 } })
  zero.setPoints({ x: -Infinity, y: 0 }, { x: Infinity, y: 0 })

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    renderBoundsPadding: { vertical: 20 },
    minLayoutSize: 6,
  })

  if (withBars.value) chart.addPlot(bar, 'plot')

  chart
    .addPlot(zero, 'plot')
    .addPlot(line, 'plot')
    .addPlot(markers, 'plot')

  return { chart, line, markers, bar }
}

watch(withBars, () => rebuild())

watchEffect(() => {
  const { chart, line, markers, bar } = instance.value
  const points = data.series.value

  line.setPoints(points)
  markers.setMarkers(points.filter((point): point is ChartPoint => point !== null))
  bar.setDatasets([{ classes: 'series-b', values: barValues.value }])

  applyBounds(chart)
  afterRender(chart, sample)
})

onMounted(() => afterRender(instance.value.chart, sample))

function applyBounds(chart: UniversalChart) {
  switch (boundsMode.value) {
    case 'auto':
      chart.setRenderBounds(undefined)
      return

    case 'zero-height':
      chart.setRenderBounds({ minX: null, maxX: null, minY: 500, maxY: 500 })
      return

    case 'inverted':
      chart.setRenderBounds({ minX: 60, maxX: 0, minY: null, maxY: null })
      return

    case 'half':
      chart.setRenderBounds({ minX: 20, maxX: null, minY: null, maxY: null })
      return

    case 'infinite':
      chart.setRenderBounds({ minX: -Infinity, maxX: null, minY: null, maxY: null })
      return
  }
}

function sample() {
  path.value = pathInfo(instance.value.line.getRootElement())
}

</script>


<style scoped lang="scss">
:deep(.universal-chart-root) {
  .markers circle {
    fill: currentColor;
  }

  .zero-line rect {
    fill: #ffffff40;
  }
}
</style>
