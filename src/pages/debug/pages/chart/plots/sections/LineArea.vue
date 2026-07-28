<template>
  <DebugSection title="AutoLineArea: заливка между двумя линиями" id="auto-line-area"
    description="Верхняя и нижняя линии задаются в обычном порядке — разворачивает нижнюю движок сам. Смотри на края разрывов: заливка обязана закрываться внутри своего сегмента, а не тянуться через дыру."
    source="src/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineArea.ts">

    <SeriesControls :state="data" hide-source />

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">разрывы</span>
        <select v-model="gapMode">
          <option v-for="item in gapModes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">ширина коридора</span>
        <input type="range" min="0" max="300" step="5" v-model.number="width">
        <span class="debug-value">{{ width }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">smoothingMethod</span>
        <select v-model="method">
          <option v-for="item in methods" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">lines</span>
        <input type="checkbox" v-model="lines">
      </label>

      <label class="debug-control">
        <span class="debug-label">заливка градиентом</span>
        <input type="checkbox" v-model="gradient">
      </label>

      <label class="debug-control" v-if="gradient">
        <span class="debug-label">забыть addDefs</span>
        <input type="checkbox" v-model="skipDefs">
      </label>

      <span class="debug-hint">
        сегментов: сверху <span class="debug-value">{{ topSegments }}</span>,
        снизу <span class="debug-value">{{ bottomSegments }}</span>,
        замкнутых пар <span class="debug-value">{{ Math.min(topSegments, bottomSegments) }}</span>
      </span>
    </div>

    <ChartStage :chart="instance.chart" :height="260" />

    <p class="debug-note">
      <b>Пары сегментов берутся по индексу.</b> Верх и низ режутся на сегменты независимо, а сшиваются
      <span class="debug-value">min(верх, низ)</span> штук подряд: режим «только в верхней» даёт один
      полигон на весь график вместо двух, а «в обеих, разные места» — две неправильные фигуры, где верх одного
      участка замкнут на низ другого. Совпадающие разрывы — единственный случай, который отрисовывается верно.
      Лишние сегменты просто пропадают: ни ошибки, ни следа.
    </p>

    <p class="debug-note">
      Переключатель <b>lines</b> пересоздаёт график: как и у area в AutoLine, выключение опции у живого рендерера
      оставит уже нарисованные линии на экране навсегда — ветка отрисовки просто перестаёт выполняться.
    </p>

    <p class="debug-note">
      Заливка без градиента <b>не имеет своего цвета</b>: у <span class="debug-value">.area</span> нет дефолтного
      стиля, и без класса это чёрное пятно. Галка «забыть addDefs» показывает вторую грань того же — градиент
      создаётся отдельно от графика, и если не отдать его в <span class="debug-value">addDefs</span>, в
      <span class="debug-value">fill</span> останется ссылка на несуществующий id: заливка молча исчезает.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import type { ChartSeries } from '@/pages/debug/shared/fixtures/types'
import { ChartGradient } from '@/shared/uiKit/chart/universalChart/defs/ChartGradient'
import { AutoLineArea } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineArea'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import SeriesControls from '../shared/SeriesControls.vue'
import { useChartInstance } from '../shared/useChartInstance'
import { useSeriesSource } from '../shared/useSeriesSource'

const methods = [
  { value: 'monotone', label: 'monotone' },
  { value: 'smooth', label: 'smooth' },
  { value: 'none', label: 'нет (ломаная)' },
] as const

const gapModes = [
  { value: 'none', label: 'нет' },
  { value: 'top', label: 'только в верхней' },
  { value: 'same', label: 'в обеих, совпадают' },
  { value: 'shifted', label: 'в обеих, в разных местах' },
] as const

const data = useSeriesSource('smooth', 100)

const method = ref<typeof methods[number]['value']>('monotone')
const gapMode = ref<typeof gapModes[number]['value']>('none')
const width = ref(80)
const lines = ref(true)
const gradient = ref(false)
const skipDefs = ref(false)

const top = computed(() => envelope(1))
const bottom = computed(() => envelope(-1))
const topSegments = computed(() => countSegments(top.value))
const bottomSegments = computed(() => countSegments(bottom.value))

const { instance, rebuild } = useChartInstance(build)

function build() {
  const fill = gradient.value
    ? new ChartGradient({ classes: 'area-gradient', direction: 'vertical' })
    : undefined

  const area = new AutoLineArea({
    classes: ['minmax-area', 'series-a', ...(fill ? [] : ['solid-area'])],
    lines: lines.value,
    fill,
    smoothingMethod: method.value === 'none' ? undefined : method.value,
  })

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    renderBoundsPadding: { vertical: 20 },
    minLayoutSize: 4,
  }).addPlot(area, 'plot')

  if (fill && !skipDefs.value) chart.addDefs(fill)

  return { chart, area }
}

watch([lines, gradient, skipDefs], () => rebuild())

watchEffect(() => {
  const { area } = instance.value
  Object.assign(area.options, { smoothingMethod: method.value === 'none' ? undefined : method.value })
  area.setPoints(top.value, bottom.value)
})

// Коридор переменной ширины: постоянный выглядел бы одинаково при любом сглаживании.
function envelope(direction: 1 | -1): ChartSeries {
  const points = data.series.value
  const length = points.length

  return points.map((point, index) => {
    if (!point) return null
    if (isGap(index, length, direction)) return null

    const delta = width.value * (1 + 0.6 * Math.sin(index / 9))
    return { x: point.x, y: point.y + direction * delta }
  })
}

function isGap(index: number, length: number, direction: 1 | -1) {
  const first = { start: Math.floor(length * 0.3), end: Math.floor(length * 0.4) }
  const second = { start: Math.floor(length * 0.6), end: Math.floor(length * 0.7) }
  const inFirst = index >= first.start && index < first.end
  const inSecond = index >= second.start && index < second.end

  switch (gapMode.value) {
    case 'none': return false
    case 'top': return direction === 1 && inFirst
    case 'same': return inFirst
    case 'shifted': return direction === 1 ? inFirst : inSecond
  }
}

function countSegments(points: ChartSeries) {
  let count = 0
  let open = false

  for (const point of points) {
    if (point && !open) {
      open = true
      count++
    } else if (!point) open = false
  }

  return count
}

</script>


<style scoped lang="scss">
:deep(.universal-chart-root) {
  .area-gradient {
    .stop-1 {
      stop-color: rgba(56, 182, 255, 0.55);
    }

    .stop-2 {
      stop-color: rgba(56, 182, 255, 0.05);
    }
  }
}
</style>
