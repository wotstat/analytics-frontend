<template>
  <DebugSection title="RectangleArea: прямоугольные области" id="rectangle-area"
    description="Область задаётся двумя точками в координатах данных. Тяни её за край графика: с layoutLimited она обрежется по области построения, без него — уедет наружу. И в любом случае не расширит bounds — на автофит область не влияет."
    source="src/shared/uiKit/chart/universalChart/plot/area/RectangleArea.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">x1</span>
        <input type="range" min="-40" max="140" step="1" v-model.number="x1">
        <span class="debug-value">{{ x1 }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">x2</span>
        <input type="range" min="-40" max="140" step="1" v-model.number="x2">
        <span class="debug-value">{{ x2 }}</span>
      </label>

      <label class="debug-control" v-if="!infiniteY">
        <span class="debug-label">y1</span>
        <input type="range" min="0" max="1000" step="10" v-model.number="y1">
        <span class="debug-value">{{ y1 }}</span>
      </label>

      <label class="debug-control" v-if="!infiniteY">
        <span class="debug-label">y2</span>
        <input type="range" min="0" max="1000" step="10" v-model.number="y2">
        <span class="debug-value">{{ y2 }}</span>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">layoutLimited</span>
        <input type="checkbox" v-model="layoutLimited">
      </label>

      <label class="debug-control">
        <span class="debug-label">y: ±Infinity</span>
        <input type="checkbox" v-model="infiniteY">
      </label>

      <label class="debug-control">
        <span class="debug-label">padding</span>
        <input type="range" min="-20" max="20" step="1" v-model.number="padding">
        <span class="debug-value">{{ padding }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">заливка паттерном</span>
        <input type="checkbox" v-model="withPattern">
      </label>

      <span class="debug-hint">rect: <span class="debug-value">{{ rectAttributes }}</span></span>
    </div>

    <ChartStage :chart="instance.chart" :height="260" />

    <p class="debug-note">
      <b>±Infinity по Y работает только вместе с layoutLimited.</b> Так область растягивается на всю высоту, не зная
      про данные — приём из боевого кода. Сними layoutLimited при включённой бесконечности: в атрибуты
      <span class="debug-value">height</span> уйдёт Infinity, проверка на отрицательные и NaN такое не ловит, и
      прямоугольник просто исчезает.
    </p>

    <p class="debug-note">
      <b>Область не участвует в bounds.</b> getBounds у RectangleArea нет, поэтому автофит её не видит: утащи x2 за
      правый край данных — график не расширится, область просто уедет за пределы. Если её нужно учесть, границы
      придётся ставить руками.
    </p>

    <p class="debug-note">
      <b>padding — в пикселях</b> и применяется уже после перевода в координаты layout, поэтому не масштабируется
      вместе с данными. Отрицательный padding расширяет прямоугольник. Если padding съел всю ширину, атрибуты
      становятся отрицательными и rect не рисуется.
    </p>

    <p class="debug-note">
      Заливка — либо CSS по классам, либо <span class="debug-value">fillByPattern</span>. Паттерн, как и градиент,
      надо отдельно отдать в <span class="debug-value">addDefs</span>, иначе fill сошлётся в пустоту. И осторожно с
      CSS: правило <span class="debug-value">fill</span> в стилях перебивает атрибут от паттерна, поэтому классы
      для «сплошной» и «паттерновой» заливки здесь разные.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { ChartRawPattern } from '@/shared/uiKit/chart/universalChart/defs/ChartRawPattern'
import { RectangleArea } from '@/shared/uiKit/chart/universalChart/plot/area/RectangleArea'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import { useChartInstance } from '../shared/useChartInstance'
import { afterRender } from '../shared/afterRender'

const series = syntheticSeries('smooth', 3, 100)

const x1 = ref(60)
const x2 = ref(90)
const y1 = ref(200)
const y2 = ref(700)
const layoutLimited = ref(true)
const infiniteY = ref(false)
const padding = ref(0)
const withPattern = ref(true)

const rectAttributes = ref('—')

const points = computed(() => ({
  p1: { x: x1.value, y: infiniteY.value ? -Infinity : y1.value },
  p2: { x: x2.value, y: infiniteY.value ? Infinity : y2.value },
}))

const { instance, rebuild } = useChartInstance(build)

function build() {
  const pattern = new ChartRawPattern()
    .setContent('<path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" class="diagonal-fill-pattern" />', { width: 4, height: 4 })
    .addAttribute('patternTransform', 'scale(1.5)')

  const line = new AutoLine({ classes: ['main-line', 'series-a'], smoothingMethod: 'monotone' })

  const area = new RectangleArea(
    ['rect-area', 'series-b', ...(withPattern.value ? [] : ['solid-rect'])],
    { layoutLimited: layoutLimited.value, padding: padding.value },
  )

  if (withPattern.value) area.fillByPattern(pattern)

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    renderBoundsPadding: { vertical: 20 },
    minLayoutSize: 4,
  })
    .addPlot(line, 'plot')
    .addPlot(area, 'plot')
    .addDefs(pattern)

  line.setPoints(series)

  return { chart, area }
}

watch([layoutLimited, padding, withPattern], () => rebuild())

watchEffect(() => {
  const { chart, area } = instance.value
  area.setPoints(points.value.p1, points.value.p2)
  afterRender(chart, sample)
})

onMounted(() => afterRender(instance.value.chart, sample))

function sample() {
  const rect = instance.value.area.getRootElement().querySelector('rect')
  if (!rect) {
    rectAttributes.value = '—'
    return
  }

  const x = rect.getAttribute('x') ?? '—'
  const y = rect.getAttribute('y') ?? '—'
  const width = rect.getAttribute('width') ?? '—'
  const height = rect.getAttribute('height') ?? '—'
  rectAttributes.value = `x ${x}, y ${y}, w ${width}, h ${height}`
}

</script>


<style scoped lang="scss">
:deep(.universal-chart-root) {
  .rect-area.solid-rect rect {
    fill: currentColor;
    fill-opacity: 0.2;
  }

  .diagonal-fill-pattern {
    stroke: #ffb02e99;
    stroke-width: 1;
    fill: none;
  }
}
</style>
