<template>
  <DebugPage title="Временной график" description="Готовые точки, ось UTC и общие аннотации без БД и игрового домена."
    source="src/shared/ui/chart/timeSeries/chart/TimeSeriesChart.ts">
    <DebugSection title="Данные и диапазон" id="time-series"
      description="Зум колесом, перемещение мышью. Среднее не соединяет разрывы. Метрика, обновление данных и видимость рядов сохраняют окно; другой шаг или диапазон сбрасывает его."
      source="src/shared/ui/chart/timeSeries/chart/TimeSeriesChart.ts">
      <div class="debug-row">
        <label class="debug-control">Шаг данных
          <select v-model="step" class="debug-select">
            <option value="day">День</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
          </select>
        </label>
        <label class="debug-control">Ось X
          <select v-model="timeAxis" class="debug-select">
            <option value="auto">Авто</option>
            <option value="day">Дни</option>
            <option value="week">Недели</option>
            <option value="month">Месяцы</option>
          </select>
        </label>
        <label class="debug-control">Среднее
          <select v-model="averageWindow" class="debug-select">
            <option :value="null">Нет</option>
            <option v-for="value in [3, 5, 7]" :key="value" :value="value">avg{{ value }}</option>
          </select>
        </label>
        <label class="debug-control">Метрика
          <select v-model="metric" class="debug-select">
            <option value="count">Количество</option>
            <option value="percent">Доля</option>
          </select>
        </label>
        <label class="debug-control">Минимальное окно
          <select v-model="minWindowPeriods" class="debug-select">
            <option v-for="value in [1, 3, 7]" :key="value" :value="value">{{ value }} {{ value === 1 ? 'период' : value
              === 3 ? 'периода' : 'периодов' }}</option>
          </select>
        </label>
        <label class="debug-control"><input v-model="gaps" type="checkbox">Разрывы</label>
        <label class="debug-control"><input v-model="second" type="checkbox">Второй ряд</label>
        <label class="debug-control"><input v-model="empty" type="checkbox">Пустые данные</label>
        <label class="debug-control"><input v-model="extended" type="checkbox">Расширить диапазон</label>
        <label class="debug-control"><input v-model="narrow" type="checkbox">Узкий контейнер</label>
      </div>
      <div class="debug-row">
        <button class="debug-button" @click="revision++">Обновить значения</button>
        <button class="debug-button" @click="zoomIn">Последние 30 дней</button>
        <button class="debug-button" @click="viewport.showAll()">Весь диапазон</button>
        <label class="debug-control"><input v-model="explicitColor" type="checkbox">Задать цвет первого ряда</label>
        <label class="debug-control">Цвет первого ряда<input v-model="color" type="color"></label>
      </div>
      <div class="debug-row">
        <label class="debug-control"><input v-model="annotationLayerEnabled" type="checkbox">Слой аннотаций</label>
        <label class="debug-control"><input v-model="labels" type="checkbox">Метки и приоритеты</label>
        <label class="debug-control"><input v-model="bands" type="checkbox">Интервалы с подписью</label>
        <label class="debug-control"><input v-model="background" type="checkbox">Фон без подписи</label>
        <label class="debug-control"><input v-model="alternativePalette" type="checkbox">Другая палитра
          аннотаций</label>
      </div>
      <div class="chart-stage"
        :class="{ narrow, 'alternative-palette': alternativePalette, 'with-annotations': annotationLayerEnabled && annotations.some(annotation => annotation.label !== undefined) }">
        <UniversalChartComponent :chart />
      </div>
      <p class="debug-note">Окно UTC: {{ bounds }}. Точки: {{ pointCount }}. null: {{ gapCount }}.</p>
      <p class="debug-note">Данные для каждого шага готовит стенд. Ось X настраивается независимо: «Авто» выбирает
        подписи по видимому диапазону. Смена оси сохраняет данные и окно. На таче: перемещение одним пальцем и зум
        двумя.</p>
      <p class="debug-note">Главные метки важнее обычных; у интервала подпись посередине, тики на границах. Фон без
        подписи не занимает верхний слот. Рядом с метками проверь зум и перемещение.</p>
      <p class="debug-note">Слой аннотаций подключается и снимается без пересоздания графика. Ограничения и сброс окна
        задаёт отдельная политика стенда.</p>
      <p class="debug-note">Без явно заданного цвета первый ряд и его маркеры зелёные — цвет задан CSS-классом.
        Переключение цвета сохраняет окно.</p>
      <p class="debug-note">Именные классы задают цвета аннотаций. Другая палитра меняет только CSS-переменные и
        сохраняет окно.</p>
      <FloatingTooltip :ctx="chart.tooltipCtx.value" anchor="pivot-x" :placement="['top-float', 'bottom-float']">
        <template #default="{ ctx }">
          <SeriesTooltip :items="tooltipRows(ctx)" :format-value="formatValue">
            <template #header>{{ ctx.hit.datum.period }}</template>
          </SeriesTooltip>
        </template>
      </FloatingTooltip>
      <EventLog :entries="log.entries.value" @clear="log.clear" />
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { computed, markRaw, onScopeDispose, ref, watch } from 'vue'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import FloatingTooltip from '@/shared/ui/chart/tooltip/FloatingTooltip.vue'
import SeriesTooltip from '@/shared/ui/chart/tooltip/SeriesTooltip.vue'
import { TimeSeriesChart, type TimeSeriesHit } from '@/shared/ui/chart/timeSeries/chart/TimeSeriesChart'
import { TimeSeriesAnnotationLayer } from '@/shared/ui/chart/timeSeries/annotations/TimeSeriesAnnotationLayer'
import { TimeSeriesViewport, minimumTimeSeriesWindow } from '@/shared/ui/chart/timeSeries/chart/TimeSeriesViewport'
import type { TimeSeriesPoint, TimeSeriesStep } from '@/shared/ui/chart/timeSeries/chart/timeSeries'
import type { TimeSeriesAnnotation } from '@/shared/ui/chart/timeSeries/annotations/timeSeriesAnnotations'
import { DAY, nextTimeSeriesPeriod, utcDayStart, utcDayString } from '@/shared/ui/chart/timeSeries/utils/timeSeriesTime'
import { seriesColor } from '@/shared/ui/chart/legend/seriesColors'
import { movingAveragePoints } from '@/shared/ui/chart/timeSeries/utils/movingAverage'
import type { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'

type DemoPoint = TimeSeriesPoint & { period: string }

const step = ref<TimeSeriesStep>('day')
const timeAxis = ref<TimeSeriesStep | 'auto'>('auto')
const averageWindow = ref<number | null>(null)
const minWindowPeriods = ref(3)
const metric = ref<'count' | 'percent'>('count')
const gaps = ref(true)
const second = ref(true)
const empty = ref(false)
const extended = ref(false)
const narrow = ref(false)
const labels = ref(true)
const bands = ref(true)
const background = ref(true)
const alternativePalette = ref(false)
const annotationLayerEnabled = ref(true)
const revision = ref(0)
const color = ref(seriesColor(0))
const explicitColor = ref(true)
const fallbackColor = '#b8d9a6'
const bounds = ref('')
const chart = markRaw(new TimeSeriesChart<DemoPoint>())
const viewport = new TimeSeriesViewport(chart)
let annotationLayer: TimeSeriesAnnotationLayer | null = null
const log = useEventLog({ max: 12 })
const range = computed(() => ({ minX: utcDayStart(extended.value ? '2025-11-01' : '2025-12-01'), maxX: utcDayStart('2026-04-01') }))
const data = computed(() => [0, 1].map(series => {
  const points: (DemoPoint | null)[] = []
  if (empty.value) return points
  const start = utcDayStart(step.value === 'month' ? '2025-12-01' : '2025-12-22')
  let index = 0
  for (let timestamp = start; timestamp < range.value.maxX; timestamp = nextTimeSeriesPeriod(timestamp, step.value)) {
    const end = Math.min(nextTimeSeriesPeriod(timestamp, step.value), range.value.maxX)
    const value = 80 + 30 * Math.sin(index * 0.8 + series) + series * 70 + revision.value * 8
    points.push(gaps.value && (index === 2 || index === 6) ? null : {
      x: (timestamp + end) / 2,
      y: metric.value === 'percent' ? value / 4 : value,
      period: `${utcDayString(timestamp)} — ${utcDayString(end - DAY)}`,
    })
    index++
  }
  return points
}))
const pointCount = computed(() => data.value[0].filter(point => point !== null).length)
const gapCount = computed(() => data.value[0].filter(point => point === null).length)
const preparedData = computed(() => data.value.map(points =>
  averageWindow.value === null ? points : movingAveragePoints(points, averageWindow.value)))

function formatValue(value: number) {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}${metric.value === 'percent' ? '%' : ''}`
}

watch(metric, value => chart.setValueFormat({ formatValue, fractional: value === 'percent' }), { immediate: true })
watch(timeAxis, mode => chart.setTimeAxis(mode), { immediate: true })
watch([color, explicitColor], ([value, explicit]) => chart.setSeriesColors([
  { tag: 'source-0', color: explicit ? value : undefined },
  { tag: 'source-1', color: seriesColor(1) },
]), { immediate: true })
watch([preparedData, second], () => chart.setSeries(preparedData.value.map((points, index) => ({
  tag: `source-${index}`, points, enabled: index === 0 || second.value,
}))), { immediate: true })
watch([range, step, minWindowPeriods], () => viewport.update({
  range: range.value,
  minWindow: minimumTimeSeriesWindow(step.value) / 3 * minWindowPeriods.value,
  resetKey: step.value,
}), { immediate: true })

const annotations = computed<TimeSeriesAnnotation[]>(() => [
  ...(background.value ? [{ id: 'background', timestamp: utcDayStart('2026-02-10'), endTimestamp: utcDayStart('2026-02-15'), classes: 'demo-annotation-background' }] : []),
  ...(bands.value ? [{ id: 'interval', timestamp: utcDayStart('2026-01-07'), endTimestamp: utcDayStart('2026-01-20'), label: 'Интервал', classes: 'demo-annotation-interval', priority: 4 }] : []),
  ...(labels.value ? Array.from({ length: 12 }, (_, index) => ({
    id: `label-${index}`, timestamp: utcDayStart('2025-12-22') + index * 7 * DAY,
    label: index % 3 === 0 ? `Главная ${index}` : `Метка ${index}`,
    classes: index % 3 === 0 ? 'demo-annotation-primary' : 'demo-annotation-secondary', priority: index % 3 === 0 ? 3 : 1,
  })) : []),
])
watch([annotationLayerEnabled, annotations], ([enabled, value]) => {
  if (!enabled) {
    annotationLayer?.dispose()
    annotationLayer = null
    return
  }
  annotationLayer ??= new TimeSeriesAnnotationLayer(chart)
  annotationLayer.setAnnotations(value)
}, { immediate: true })
onScopeDispose(() => annotationLayer?.dispose())

onScopeDispose(chart.onAfterRender.on(({ space }) => {
  if (!space.bounds.isEmpty()) bounds.value = `${new Date(space.bounds.minX * 1000).toISOString()} — ${new Date(space.bounds.maxX * 1000).toISOString()}`
}))
onScopeDispose(chart.onSeriesClick.on(({ tag, event }) => {
  log.push(`Клик ${tag}${event.altKey ? ' + Alt' : ''}${event.isTouch ? ' (touch)' : ''}`)
}))

function zoomIn() {
  chart.setRenderBounds({ minX: range.value.maxX - 30 * DAY, maxX: range.value.maxX, minY: null, maxY: null })
}

function tooltipRows(ctx: TooltipCtx<TimeSeriesHit<DemoPoint>>) {
  const hits = new Map(ctx.hits.map(hit => [hit.interactionTag, hit]))
  return [0, ...(second.value ? [1] : [])].map(index => {
    const tag = `source-${index}`
    const hit = hits.get(tag)
    return {
      tag, name: `Ряд ${index + 1}`, color: index === 0 ? explicitColor.value ? color.value : fallbackColor : seriesColor(1), value: hit?.datum.y,
      highlighted: !!hit && ctx.highlights.some(highlight => highlight.isHighlighted(hit))
    }
  })
}
</script>

<style scoped lang="scss">
@use '@/shared/ui/chart/timeSeries/chart/timeSeriesChart.scss' as *;
@use '@/shared/ui/chart/timeSeries/annotations/timeSeriesAnnotations.scss' as *;

.chart-stage {
  position: relative;
  width: 100%;
  height: 320px;

  &.narrow {
    width: 320px;
    max-width: 100%;
  }

  .chart-container {
    width: 100%;
    height: 100%;
  }

  :deep(.universal-chart-root) {
    @include time-series-chart;
    @include time-series-annotations;
  }

  :deep(.time-series-series-0) {
    color: #b8d9a6;
  }

  :deep(.demo-annotation-primary) {
    color: var(--demo-annotation-primary-color, #f1c578);
  }

  :deep(.demo-annotation-secondary) {
    color: var(--demo-annotation-secondary-color, #b6cde6);
  }

  :deep(.demo-annotation-interval) {
    color: var(--demo-annotation-interval-color, #b8d9a6);
  }

  :deep(.demo-annotation-background) {
    color: var(--demo-annotation-background-color, #eb6759);
  }

  &.alternative-palette {
    --demo-annotation-primary-color: #d1b3e6;
    --demo-annotation-secondary-color: #a6d9d4;
    --demo-annotation-interval-color: #f1c578;
    --demo-annotation-background-color: #b6cde6;
  }

  &.with-annotations :deep(.grid) {
    opacity: 0.1;
  }
}
</style>
