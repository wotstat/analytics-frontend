<template>
  <DebugSection title="PolygonArea: произвольные полигоны" id="polygon-area"
    description="Один SVG path может содержать вогнутый внешний контур и отверстия. Сдвигай фигуру за chartSpace: встроенный culling скрывает её целиком только после выхода общего bbox и никогда не обрезает рёбра."
    source="src/shared/uiKit/chart/universalChart/plot/area/PolygonArea.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">сдвиг X</span>
        <input type="range" min="-160" max="160" step="1" v-model.number="offsetX">
        <span class="debug-value">{{ offsetX }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">stroke-width</span>
        <input type="range" min="0" max="12" step="0.5" v-model.number="strokeWidth">
        <span class="debug-value">{{ strokeWidth }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">заливка</span>
        <select v-model="fill">
          <option value="solid">fill</option>
          <option value="gradient">gradient</option>
          <option value="pattern">pattern</option>
        </select>
      </label>

      <span class="debug-hint">
        path: <span class="debug-value">{{ visible ? `${pathLength} симв.` : 'скрыт' }}</span>
      </span>
    </div>

    <ChartStage :chart="instance.chart" :height="280" />

    <p class="debug-note">
      <b>Отверстие — второй subpath.</b> Внутренний контур передан в обратном направлении относительно внешнего,
      поэтому стандартный SVG fill-rule <span class="debug-value">nonzero</span> оставляет его прозрачным.
      При необходимости правило можно заменить обычным CSS.
    </p>

    <p class="debug-note">
      <b>PolygonArea всегда делает грубый culling.</b> Пока общий bbox пересекает chartSpace, path остаётся целым —
      вершины не прижимаются к краям и рёбра не клипуются. После полного выхода bbox атрибут
      <span class="debug-value">d</span> очищается. Отдельной настройки у этого поведения нет.
    </p>

    <p class="debug-note">
      <b>Полигон по умолчанию участвует в auto-fit.</b> Здесь диапазон <span class="debug-value">0…100</span>
      установлен вручную, чтобы сдвиг не увозил viewport за фигурой. Участие можно отключить через
      <span class="debug-value">affectsBounds: false</span>. Сплошная заливка и stroke задаются CSS, градиент и
      паттерн — существующими SVG defs.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { onMounted, ref, watch, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { ChartGradient } from '@/shared/uiKit/chart/universalChart/defs/ChartGradient'
import { ChartRawPattern } from '@/shared/uiKit/chart/universalChart/defs/ChartRawPattern'
import { PolygonArea } from '@/shared/uiKit/chart/universalChart/plot/area/PolygonArea'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import type { Point } from '@/shared/uiKit/chart/universalChart/utils/Point'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import { afterRender } from '../shared/afterRender'
import { useChartInstance } from '../shared/useChartInstance'

const outer: Point[] = [
  { x: 10, y: 10 },
  { x: 85, y: 10 },
  { x: 85, y: 85 },
  { x: 55, y: 85 },
  { x: 55, y: 55 },
  { x: 35, y: 55 },
  { x: 35, y: 85 },
  { x: 10, y: 85 },
]

const hole: Point[] = [
  { x: 60, y: 25 },
  { x: 60, y: 42 },
  { x: 77, y: 42 },
  { x: 77, y: 25 },
]

const offsetX = ref(0)
const strokeWidth = ref(2)
const fill = ref<'solid' | 'gradient' | 'pattern'>('solid')
const visible = ref(false)
const pathLength = ref(0)

const { instance, rebuild } = useChartInstance(build)

function build() {
  const gradient = new ChartGradient({
    direction: 'to right',
    steps: [
      { offset: 0, color: '#ffb02ecc' },
      { offset: 1, color: '#c58cff66' },
    ],
  })

  const pattern = new ChartRawPattern()
    .setContent('<path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" class="polygon-pattern" />', {
      width: 8,
      height: 8,
    })

  const polygon = new PolygonArea([
    'polygon-area',
    'series-b',
    ...(fill.value === 'solid' ? ['solid-polygon'] : []),
  ])

  if (fill.value === 'gradient') {
    const path = polygon.getRootElement().querySelector('path')
    if (path) gradient.fill(path as SVGGElement)
  }
  else if (fill.value === 'pattern') {
    polygon.fillByPattern(pattern)
  }

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    minLayoutSize: 4,
  })
    .addPlot(polygon, 'plot')
    .addDefs(gradient, pattern)

  chart.setRenderBounds({ minX: 0, maxX: 100, minY: 0, maxY: 100 })

  return { chart, polygon }
}

watch(fill, () => rebuild())

watchEffect(() => {
  const { chart, polygon } = instance.value
  const move = (point: Point): Point => ({ x: point.x + offsetX.value, y: point.y })

  polygon.setPoints([outer.map(move), hole.map(move)])
  const root = polygon.getRootElement() as SVGElement
  root.style.setProperty('--polygon-stroke-width', `${strokeWidth.value}px`)
  afterRender(chart, sample)
})

onMounted(() => afterRender(instance.value.chart, sample))

function sample() {
  const path = instance.value.polygon.getRootElement().querySelector('path')
  const d = path?.getAttribute('d') ?? ''
  visible.value = d.length > 0
  pathLength.value = d.length
}

</script>


<style scoped lang="scss">
:deep(.universal-chart-root) {
  .polygon-area path {
    stroke: currentColor;
    stroke-width: var(--polygon-stroke-width);
    stroke-linejoin: round;
  }

  .polygon-area.solid-polygon path {
    fill: currentColor;
    fill-opacity: 0.3;
  }

  .polygon-pattern {
    stroke: #ffb02ecc;
    stroke-width: 2;
    fill: none;
  }
}
</style>
