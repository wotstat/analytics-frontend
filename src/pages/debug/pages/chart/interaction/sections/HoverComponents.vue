<template>
  <DebugSection title="Ховер-компоненты" id="hover-components"
    description="VerticalLine, HorizontalLine, NearestMarker, CallbackComponent — по отдельности и вместе. Все реагируют на один и тот же ховер, но каждый решает сам, куда встать и когда спрятаться."
    source="src/shared/uiKit/chart/universalChart/interaction/composable/components/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">VerticalLine</span>
        <input type="checkbox" v-model="verticalLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">HorizontalLine</span>
        <input type="checkbox" v-model="horizontalLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">NearestMarker</span>
        <input type="checkbox" v-model="marker">
      </label>

      <label class="debug-control">
        <span class="debug-label">ChartTooltip</span>
        <input type="checkbox" v-model="tooltip">
      </label>

      <label class="debug-control">
        <span class="debug-label">CallbackComponent в лог</span>
        <input type="checkbox" v-model="logEnabled">
      </label>

      <label class="debug-control">
        <span class="debug-label">включая update-события</span>
        <input type="checkbox" v-model="logMoves" :disabled="!logEnabled">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">position линий</span>
        <select v-model="linePosition">
          <option v-for="item in linePositions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">position маркера и тултипа</span>
        <select v-model="pointPosition">
          <option v-for="item in pointPositions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">tooltipPivot</span>
        <select v-model="tooltipPivot">
          <option v-for="item in pivots" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">offset линий</span>
        <input type="number" v-model.number="lineOffset" step="5">
      </label>

      <label class="debug-control">
        <span class="debug-label">размер маркера</span>
        <input type="number" v-model.number="markerSize" min="1" max="20">
      </label>

      <label class="debug-control">
        <span class="debug-label">activateDistance</span>
        <input type="checkbox" v-model="limitDistance">
      </label>

      <label class="debug-control" v-if="limitDistance">
        <input type="range" v-model.number="activateDistance" min="5" max="200" step="5">
        <span class="debug-value">{{ activateDistance }}px</span>
      </label>

      <label class="debug-control" v-if="limitDistance">
        <span class="debug-label">outOfDistanceVisibility</span>
        <input type="checkbox" v-model="outOfDistanceVisibility">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">данные</span>
        <select v-model="kind">
          <option v-for="item in kinds" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">рядов</span>
        <select v-model.number="seriesCount">
          <option :value="1">1</option>
          <option :value="3">3</option>
        </select>
      </label>
    </div>

    <DemoChartView :chart="chart" :height="260" />

    <FloatingTooltip :ctx="chart.tooltipCtx.value" anchor="pivot">
      <template #default="{ ctx }">
        <TooltipCard :ctx="ctx" />
      </template>
    </FloatingTooltip>

    <EventLog :entries="entries" title="CallbackComponent" empty="Событий пока не было" @clear="clear" />

    <p class="debug-hint">
      Ближайшие точки ищет сам контроллер (<span class="debug-value">BaseDataSourcedInteractionController</span>),
      результат кешируется на кадр — поэтому три компонента с одинаковым position не считают одно и то же трижды.
    </p>

    <p class="debug-note">
      На что смотреть: <span class="debug-value">cursor</span> — линия едет ровно за указателем;
      <span class="debug-value">data-point-x</span> — снап по X, линия стоит на точке, а по Y идёт через курсор;
      <span class="debug-value">data-point</span> — снап по обеим осям;
      <span class="debug-value">nearest-data-point</span> (маркер и тултип) — оставляет только один ряд, ближайший к
      курсору. При трёх рядах и <span class="debug-value">data-point-x</span> маркеров будет столько же, сколько рядов
      с этим X, а <span class="debug-value">tooltipPivot: avg</span> поставит тултип в их среднюю точку.
    </p>

    <p class="debug-note">
      <span class="debug-value">activateDistance</span> отсекает точки дальше N пикселей: уводи курсор от линии —
      маркер и тултип гаснут. Линия при этом исчезает совсем, а с
      <span class="debug-value">outOfDistanceVisibility</span> остаётся, но переезжает на курсор. Набор «С пропусками»
      + маленький activateDistance — самое наглядное: над дырой в данных всё гаснет.
    </p>

    <p class="debug-note">
      Пальцем: ховер включается удержанием (200 мс), а не касанием — быстрый тап не показывает ни линии, ни тултипа.
      Ведя палец, следи за <span class="debug-value">isTouch</span> в подвале карточки: тултип должен знать, что это
      палец. Уводя палец за край графика, проверь, что ховер гаснет и лог получает
      <span class="debug-value">hoverEnd</span>.
    </p>

    <p class="debug-note">
      Неочевидное: направление, которое <span class="debug-value">mayHover</span> возвращает
      (<span class="debug-value">horizontal</span> для data-point-x и т.д.), нигде не используется — автомат смотрит
      только на «истина/ложь». Ограничивает жест по осям исключительно
      <span class="debug-value">mayPan</span>.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticMultiSeries, syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import DemoChartView from '../shared/DemoChartView.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import TooltipCard from '../shared/TooltipCard.vue'
import { DemoChart, type LinePosition, type PointPosition } from '../shared/DemoChart'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const linePositions = ['cursor', 'data-point-x', 'data-point-y', 'data-point'] as const satisfies readonly LinePosition[]
const pointPositions = ['data-point-x', 'data-point-y', 'data-point', 'nearest-data-point'] as const satisfies readonly PointPosition[]
const pivots = ['avg', 'nearest', 'cursor'] as const

const kinds = [
  { value: 'smooth', label: 'Гладкая' },
  { value: 'noisy', label: 'Шумная' },
  { value: 'gaps', label: 'С пропусками' },
] as const

const verticalLine = ref(true)
const horizontalLine = ref(false)
const marker = ref(true)
const tooltip = ref(true)
const logEnabled = ref(true)
const logMoves = ref(false)

const linePosition = ref<LinePosition>('data-point-x')
const pointPosition = ref<PointPosition>('data-point-x')
const tooltipPivot = ref<'avg' | 'nearest' | 'cursor'>('avg')
const lineOffset = ref(0)
const markerSize = ref(4)
const limitDistance = ref(false)
const activateDistance = ref(60)
const outOfDistanceVisibility = ref(false)

const kind = ref<typeof kinds[number]['value']>('smooth')
const seriesCount = ref(1)

const { entries, push, clear } = useEventLog({ collapseRepeats: true })

const chart = markRaw(new DemoChart({ seriesCount: 3 }))

const stopCallbacks = [
  chart.callback.on('hoverBegin', () => log('hoverBegin')),
  chart.callback.on('hoverUpdate', event => logMove(`hoverUpdate ${event.point.x.toFixed(0)}, ${event.point.y.toFixed(0)}`)),
  chart.callback.on('hoverEnd', () => log('hoverEnd')),
  chart.callback.on('panBegin', event => log(`panBegin ${event.isTouch ? 'палец' : 'мышь'}`)),
  chart.callback.on('panUpdate', () => logMove('panUpdate')),
  chart.callback.on('panEnd', () => log('panEnd')),
  chart.callback.on('wheelZoom', event => log(`wheelZoom deltaY ${event.deltaY.toFixed(0)}`)),
  chart.callback.on('touchZoomBegin', () => log('touchZoomBegin')),
  chart.callback.on('touchZoomUpdate', () => logMove('touchZoomUpdate')),
  chart.callback.on('touchZoomEnd', () => log('touchZoomEnd')),
]

function log(text: string) {
  if (logEnabled.value) push(text)
}

// hoverUpdate прилетает каждым движением указателя — по умолчанию не засоряем им лог.
function logMove(text: string) {
  if (logEnabled.value && logMoves.value) push(text)
}

watchEffect(() => {
  const series = seriesCount.value === 1
    ? [syntheticSeries(kind.value, 5, 120), [], []]
    : syntheticMultiSeries(3, 5, 120)

  chart.setSeries(series)
  chart.resetView()
})

watchEffect(() => chart.setHover({
  verticalLine: verticalLine.value,
  horizontalLine: horizontalLine.value,
  marker: marker.value,
  tooltip: tooltip.value,
  linePosition: linePosition.value,
  pointPosition: pointPosition.value,
  lineOffset: lineOffset.value,
  markerSize: markerSize.value,
  activateDistance: limitDistance.value ? activateDistance.value : null,
  outOfDistanceVisibility: outOfDistanceVisibility.value,
  tooltipPivot: tooltipPivot.value,
}))

onUnmounted(() => {
  for (const stop of stopCallbacks) stop()
})

</script>
