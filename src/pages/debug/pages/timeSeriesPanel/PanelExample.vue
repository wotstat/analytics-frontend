<template>
  <div class="debug-row">
    <label class="debug-control">Состояние
      <select v-model="state" class="debug-select">
        <option value="ready">Готово</option>
        <option value="loading">Загрузка</option>
        <option value="error">Ошибка</option>
        <option value="empty">Нет данных</option>
      </select>
    </label>
    <label class="debug-control"><input v-model="multiple" type="checkbox">Несколько рядов</label>
    <label class="debug-control"><input v-model="many" type="checkbox">21 ряд</label>
    <label class="debug-control"><input v-model="partial" type="checkbox">Частичная загрузка</label>
    <label class="debug-control"><input v-model="narrow" type="checkbox">Ширина 320 px</label>
    <button class="debug-button" @click="restore">Вернуть источники</button>
  </div>
  <TimeSeriesPanel :chart :legend :density :has-values="hasValues" :format-value="formatValue"
    :tooltip="density === 'compact' && !multiple ? 'header' : 'floating'" :show-legend="multiple" color-editable
    removable class="demo-panel" :class="{ narrow }" @color-change="changeColor"
    @remove="source => removed.add(source.tag)" @series-click="onSeriesClick">
    <template #header><b>Синтетическая история</b></template>
    <template #toolbar>
      <ToolbarOptions v-model="metric" :options="metricOptions" />
    </template>
    <template #actions>
      <ToolbarButton :icon="ResetIcon" @click="viewport.showAll()" />
    </template>
    <template v-if="density === 'compact' && !multiple" #tooltip="{ ctx }">
      <div class="header-value">{{ formatValue(ctx.hit.datum.y) }} · {{ ctx.hit.datum.date }}</div>
    </template>
    <template #tooltip-header="{ ctx, horizontal }">
      <b>{{ metric === 'count' ? 'Количество' : 'Доля' }}</b>
      <span :class="{ horizontal }">{{ ctx.hit.datum.date }}</span>
    </template>
    <template v-if="!hasValues" #state>
      <template v-if="state === 'loading'">
        <Loader compact />Загрузка истории…
      </template>
      <template v-else-if="state === 'error'">
        Не удалось загрузить историю<button @click="state = 'ready'">Повторить</button>
      </template>
      <template v-else>{{ legend.enabled.value.length ? 'Нет данных' : 'Включите источники в легенде' }}</template>
    </template>
    <template #details>
      <div v-if="partial" class="detail">Источник 2: ошибка. Источник 3 загружается. Первый ряд доступен.
        <button @click="partial = false">Повторить</button>
      </div>
    </template>
  </TimeSeriesPanel>
  <p class="debug-note">Включено {{ legend.enabled.value.length }}/{{ legend.items.value.length }}.
    Цвет и удаление меняют исходные источники. Alt/Shift в легенде; клик по линии выключает ряд,
    Alt-клик оставляет только его. Другую панель эти действия не меняют.</p>
  <EventLog :entries="log.entries.value" @clear="log.clear" />
</template>

<script setup lang="ts">
import { computed, markRaw, reactive, ref, watch } from 'vue'
import ResetIcon from '@/assets/icons/reset.svg'
import TimeSeriesPanel from '@/shared/ui/chart/timeSeries/panel/TimeSeriesPanel.vue'
import ToolbarOptions from '@/shared/ui/chart/timeSeries/toolbar/options/ToolbarOptions.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'
import { TimeSeriesChart } from '@/shared/ui/chart/timeSeries/chart/TimeSeriesChart'
import { TimeSeriesViewport } from '@/shared/ui/chart/timeSeries/chart/TimeSeriesViewport'
import { useLegend } from '@/shared/ui/chart/legend/useLegend'
import { seriesColor } from '@/shared/ui/chart/legend/seriesColors'
import { DAY, utcDayStart, utcDayString } from '@/shared/ui/chart/timeSeries/utils/timeSeriesTime'
import type { TimeSeriesPoint } from '@/shared/ui/chart/timeSeries/chart/timeSeries'
import type { ClickInteractionEvent } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'

type DemoPoint = TimeSeriesPoint & { date: string }
type DemoSource = { tag: string, name: string, color: string, loading: boolean }

const props = defineProps<{ density: 'standard' | 'compact' }>()
const state = ref('ready')
const metric = ref<'count' | 'percent'>('count')
const multiple = ref(props.density === 'standard')
const many = ref(false)
const partial = ref(false)
const narrow = ref(false)
const removed = reactive(new Set<string>())
const colors = reactive(new Map<string, string>())
const log = useEventLog({ max: 6 })
const metricOptions = [{ value: 'count', label: 'Количество' }, { value: 'percent', label: 'Доля' }] as const

const sources = computed<DemoSource[]>(() => Array.from({ length: multiple.value ? many.value ? 21 : 3 : 1 }, (_, i) => ({
  tag: `source-${i}`, name: `Источник ${i + 1}`, color: colors.get(`source-${i}`) ?? seriesColor(i),
  loading: state.value === 'loading' || (partial.value && i === 2),
})).filter(source => !removed.has(source.tag)))
const legend = useLegend(sources)
const chart = markRaw(new TimeSeriesChart<DemoPoint>(legend.highlightSync))
const viewport = new TimeSeriesViewport(chart)
const start = utcDayStart('2026-01-01')
const series = computed(() => sources.value.map((source, index) => ({
  tag: source.tag, enabled: legend.isEnabled(source),
  points: state.value !== 'ready' || (partial.value && index > 0) ? [] : Array.from({ length: 90 }, (_, i) =>
    i % 17 === index % 17 ? null : {
      x: start + i * DAY, y: (80 + index * 20 + Math.sin(i * 0.3 + index) * 20) / (metric.value === 'percent' ? 10 : 1),
      date: utcDayString(start + i * DAY),
    }),
})))
const hasValues = computed(() => series.value.some(source => source.enabled && source.points.length > 0))

watch(series, value => chart.setSeries(value), { immediate: true })
watch(metric, () => chart.setValueFormat({ formatValue, fractional: metric.value === 'percent', minValue: 0 }), { immediate: true })
viewport.update({ range: { minX: start, maxX: start + 90 * DAY }, minWindow: 3 * DAY })

function formatValue(value: number) {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}${metric.value === 'percent' ? '%' : ''}`
}

function changeColor(source: DemoSource, color: string) {
  colors.set(source.tag, color)
  log.push(`${source.name}: цвет ${color}`)
}

function onSeriesClick({ tag, event }: { tag: string, event: ClickInteractionEvent }) {
  log.push(`Клик ${tag}${event.altKey ? ' + Alt' : ''}`)
  if (event.isTouch) return
  event.preventPanInertion()
  legend.setEnabled(legend.items.value.filter(source => event.altKey ? source.tag !== tag : source.tag === tag), false)
}

function restore() {
  removed.clear()
  legend.setEnabled(legend.items.value, true)
}
</script>

<style scoped lang="scss">
.demo-panel {
  width: 100%;
  position: relative;

  &.narrow {
    max-width: 320px;
  }
}

.header-value {
  font-size: 13px;
  white-space: nowrap;
}

.horizontal {
  margin-left: auto;
}

.detail {
  margin-top: 12px;
  font-size: 12px;
}
</style>
