<template>
  <DebugSection title="AutoLine: сглаживание, точность, классы" id="auto-line"
    description="Одна линия и ничего больше. Крути smoothingMethod и smoothing: monotone обязан оставаться в коридоре значений (никаких выбросов между точками), smooth на больших значениях вылетает за точки. На наборе «С пропусками» линия рвётся на каждом null, а не соединяет края разрыва."
    source="src/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine.ts">

    <SeriesControls :state="data" />

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">smoothingMethod</span>
        <select v-model="method">
          <option v-for="item in methods" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">smoothing</span>
        <input type="range" min="0" max="3" step="0.05" v-model.number="smoothing">
        <span class="debug-value">{{ smoothing.toFixed(2) }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">precision</span>
        <input type="number" min="0" max="6" step="1" v-model.number="precision">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">area</span>
        <input type="checkbox" v-model="area">
      </label>

      <label class="debug-control">
        <span class="debug-label">класс цвета</span>
        <select v-model="color">
          <option v-for="item in colors" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">толщина (CSS)</span>
        <select v-model="width">
          <option v-for="item in widths" :key="item" :value="item">{{ item }}px</option>
        </select>
      </label>

      <span class="debug-hint">
        d: <span class="debug-value">{{ path.length }}</span> симв.,
        C: <span class="debug-value">{{ path.curves }}</span>,
        L: <span class="debug-value">{{ path.lines }}</span>,
        M: <span class="debug-value">{{ path.moves }}</span>
      </span>
    </div>

    <ChartStage :chart="instance.chart" :version :class="`stroke-${width}`" :height="260" />

    <p class="debug-note">
      <b>precision действует ровно на одну ветку — smooth.</b> Monotone печатает координаты с двумя знаками жёстко
      (и в wasm, и в TS), чистая ломаная — тоже жёстко двумя. Смотри на длину d: на monotone она от precision не
      меняется вообще.
    </p>

    <p class="debug-note">
      <b>smoothing</b> у monotone зажат в 0…1 (единица — обычный монотонный сплайн, ноль — ломаная), у smooth не
      ограничен ничем: ставь 2–3 и смотри, как кривая уезжает за собственные точки. И главное:
      <span class="debug-value">smoothingMethod: не задан</span> — это не «без сглаживания». Пока
      <span class="debug-value">smoothing</span> не ноль, рисуется smooth; настоящая ломаная получается только при
      smoothing = 0. Отдельного «выключено» у метода нет.
    </p>

    <p class="debug-note">
      <b>Цвет и толщина — только CSS.</b> Классы уходят в конструктор и попадают и на корневой
      <span class="debug-value">g</span>, и на сам <span class="debug-value">path.line</span>; линия красится в
      <span class="debug-value">currentColor</span> базовым стилем движка, поэтому классу достаточно задать
      <span class="debug-value">color</span>. Толщина здесь меняется вообще без участия движка — CSS-классом на
      контейнере. Смена класса цвета пересоздаёт график: заменить classes у живого рендерера нечем.
    </p>

    <p class="debug-note">
      Переключатель <b>area</b> тоже пересоздаёт график, и не от лени: если сбросить
      <span class="debug-value">options.area</span> у живого рендерера, отрисованная заливка останется на экране —
      ветка area в renderImpl просто перестаёт выполняться, а старый path с прошлым d никто не чистит.
    </p>

    <p class="debug-note">
      На наборе <b>100k точек</b> любой режим, кроме monotone, строит путь на все точки разом: вкладка встанет
      на несколько секунд, и это ожидаемо — децимация живёт только в monotone (см. секцию ниже).
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { onMounted, ref, watch, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import SeriesControls from '../shared/SeriesControls.vue'
import { useSeriesSource } from '../shared/useSeriesSource'
import { useChartInstance } from '../shared/useChartInstance'
import { afterRender, pathInfo, type PathInfo } from '../shared/afterRender'

const methods = [
  { value: 'none', label: 'не задан' },
  { value: 'monotone', label: 'monotone' },
  { value: 'smooth', label: 'smooth' },
] as const

const colors = ['series-a', 'series-b', 'series-c', 'series-d'] as const
const widths = [1, 2, 4, 8] as const

const data = useSeriesSource('smooth', 120)

const method = ref<typeof methods[number]['value']>('monotone')
const smoothing = ref(1)
const precision = ref(2)
const area = ref(true)
const color = ref<typeof colors[number]>('series-a')
const width = ref<typeof widths[number]>(2)

const path = ref<PathInfo>({ length: 0, curves: 0, lines: 0, moves: 0 })

const { instance, version, rebuild } = useChartInstance(build)

function build() {
  const line = new AutoLine({
    classes: ['main-line', 'solid-area', color.value],
    area: area.value,
    smoothingMethod: method.value === 'none' ? undefined : method.value,
    smoothing: smoothing.value,
    precision: precision.value,
  })

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    renderBoundsPadding: { vertical: 20 },
    minLayoutSize: 4,
  }).addPlot(line, 'plot')

  return { chart, line }
}

watch([area, color], () => rebuild())

watchEffect(() => {
  const { chart, line } = instance.value

  Object.assign(line.options, {
    smoothingMethod: method.value === 'none' ? undefined : method.value,
    smoothing: smoothing.value,
    precision: precision.value,
  })

  line.setPoints(data.series.value)
  afterRender(chart, sample)
})

onMounted(() => afterRender(instance.value.chart, sample))

function sample() {
  path.value = pathInfo(instance.value.line.getRootElement())
}

</script>


<style scoped lang="scss">
.stroke-1 :deep(.line) {
  stroke-width: 1px;
}

.stroke-4 :deep(.line) {
  stroke-width: 4px;
}

.stroke-8 :deep(.line) {
  stroke-width: 8px;
}
</style>
