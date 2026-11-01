<template>
  <DebugSection title="InteractionPresentation" id="interaction-presentation"
    description="Анимация привязок линии, маркеров и тултипа. Общая координата связывает нужные элементы, скорость сохраняется при смене цели."
    source="src/shared/uiKit/chart/universalChart/interaction/composable/presentation/InteractionPresentation.ts">
    <div class="debug-row">
      <label class="debug-control"><input type="checkbox" v-model="enabled">Сглаживание</label>
      <label class="debug-control"><input type="checkbox" v-model="followLine" :disabled="!enabled">По линии</label>
      <label class="debug-control"><input type="checkbox" v-model="split" :disabled="!enabled">Раздельные профили</label>
      <button class="debug-btn" @click="setSpring(0.3, 1)">Мягко</button>
      <button class="debug-btn" @click="setSpring(0.105, 1)">Быстро</button>
      <button class="debug-btn" @click="setSpring(0.25, 0.6)">Пружина</button>
      <button class="debug-btn" @click="reset">Сбросить настройки</button>
    </div>

    <div class="motion-profile" v-for="item in controls" :key="item.key">
      <b>{{ item.label }}</b>
      <div class="debug-row">
        <label class="debug-control">Response, с
          <input type="range" v-model.number="item.motion.response" min="0.05" max="1" step="0.005" :disabled="!enabled">
          <output class="debug-value motion-value">{{ item.motion.response.toFixed(3) }}</output>
        </label>
        <label class="debug-control">Damping ratio
          <input type="range" v-model.number="item.motion.dampingRatio" min="0" max="2" step="0.05" :disabled="!enabled">
          <output class="debug-value motion-value">{{ item.motion.dampingRatio.toFixed(2) }}</output>
        </label>
      </div>
    </div>

    <div class="debug-row">
      <label class="debug-control">Данные
        <select v-model="preset">
          <option v-for="item in seriesPresets" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label class="debug-control">Pivot
        <select v-model="pivot">
          <option v-for="value in pivots" :key="value" :value="value">{{ value }}</option>
        </select>
      </label>
      <label class="debug-control">Допуск по X
        <select v-model="maxAxisDistance">
          <option :value="null">Без ограничения</option>
          <option :value="20">20 px</option>
          <option :value="50">50 px</option>
          <option :value="100">100 px</option>
        </select>
      </label>
      <label class="debug-control">Привязка
        <select v-model="anchor">
          <option value="pivot">Обе координаты</option>
          <option value="pivot-x">Только X</option>
          <option value="pivot-y">Только Y</option>
          <option value="cursor">Курсор</option>
        </select>
      </label>
      <button class="debug-btn" @click="chart.resetView()">Весь диапазон</button>
      <button class="debug-btn" @click="closeUp">Крупнее</button>
    </div>

    <DemoChartView :chart="chart" :height="320" class="presentation-chart" />
    <FloatingTooltip :ctx="ctx" :anchor="anchor">
      <template #default="{ ctx: current }">
        <SeriesTooltip :items="tooltipItems(current)" :format-value="formatValue">
          <template #header>X: {{ current.hit.kind === 'cursor' ? 'курсор' : current.hit.datum.x }}</template>
        </SeriesTooltip>
      </template>
    </FloatingTooltip>

    <pre class="debug-value config">{{ configLabel }}</pre>
    <p class="debug-note">Response — собственный период пружины в секундах, а не время завершения перехода.
      Меньше response — быстрее движение. Damping ratio: меньше 1 — колебания, 1 — критическое затухание,
      больше 1 — вязкое движение; при 0 колебания не затухают.
      Points задаёт движение привязок маркеров и линий, cursor — следование за мышью,
      anchor — переход готовой привязки тултипа после вычисления nearest, max-y или avg.
      Для проверки anchor выбери «Обе координаты», затем двигай мышь между точками и рядами.
      Cursor проверяется через pivot: cursor или привязку «Курсор». Перемещение мышью и зум колесом работают
      вместе с анимацией. В режиме «По линии» линия и маркеры используют один анимированный X,
      маркеры получают Y из кривой, а готовый pivot тултипа анимируется независимо.
      В разрывах и за концами ряда маркер остаётся на ближайшей границе участка.
      При возвращении пружинного X на линию маркер сразу снова следует кривой.
      Допуск по X явно передаётся в selection и alongAxis: первый проверяет расстояние от курсора,
      второй — от пружинного X до ближайшей границы. Вне допуска alongAxis скрывается только маркер;
      линия и тултип продолжают движение. Вне допуска selection скрывается всё.
      Изменение настроек начинает новый переход; окно графика сохраняется.</p>
  </DebugSection>
</template>

<script setup lang="ts">
import { computed, markRaw, onScopeDispose, reactive, ref, shallowRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import FloatingTooltip from '@/shared/ui/chart/tooltip/FloatingTooltip.vue'
import SeriesTooltip from '@/shared/ui/chart/tooltip/SeriesTooltip.vue'
import type { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { spring } from '@/shared/uiKit/chart/universalChart/interaction/composable/presentation/InteractionPresentation'
import DemoChartView from '../shared/DemoChartView.vue'
import { MultiLineChart, type ComposedHit, type CompositionConfig } from '../shared/MultiLineChart'
import { seriesPresets, type SeriesPreset } from '../shared/tooltipSeries'

const enabled = ref(true)
const followLine = ref(true)
const maxAxisDistance = ref<number | null>(null)
const split = ref(false)
const commonMotion = reactive({ response: 0.105, dampingRatio: 1 })
const profiles = reactive({
  points: { response: 0.105, dampingRatio: 1 },
  cursor: { response: 0.155, dampingRatio: 1 },
  anchor: { response: 0.21, dampingRatio: 1 },
})
const channels = [
  { key: 'points', label: 'Точки · points' },
  { key: 'cursor', label: 'Курсор · cursor' },
  { key: 'anchor', label: 'Привязка тултипа · anchor' },
] as const
const controls = computed(() => {
  if (!split.value) return [{ key: 'common', label: 'Общий профиль', motion: commonMotion }]
  return channels.map(item => ({ ...item, motion: profiles[item.key] }))
})
const preset = ref<SeriesPreset>('aligned')
const pivot = ref<CompositionConfig['tooltipPivot']>('nearest')
const pivots = ['nearest', 'cursor', 'avg', 'min-x', 'max-x', 'min-y', 'max-y', 'min', 'max'] as const
const anchor = ref<'pivot' | 'pivot-x' | 'pivot-y' | 'cursor'>('pivot')
const chart = markRaw(new MultiLineChart({ zoom: true }))
const ctx = shallowRef<TooltipCtx<ComposedHit> | null>(null)
const colors: Record<string, string> = { A: '#02afff', B: '#57ff6e', C: '#ffb057' }
const presentation = computed(() => {
  const follow = followLine.value
  if (!split.value) return { followLine: follow, motion: spring(commonMotion) }
  return {
    followLine: follow,
    motion: {
      points: spring(profiles.points),
      cursor: spring(profiles.cursor),
      anchor: spring(profiles.anchor),
    },
  }
})
const configLabel = computed(() => enabled.value ? JSON.stringify(presentation.value, null, 2) : 'presentation выключен')

onScopeDispose(chart.onTooltip.on(next => ctx.value = next))
watchEffect(() => chart.setConfig({
  preset: preset.value,
  tooltipPivot: pivot.value,
  maxAxisDistance: maxAxisDistance.value,
  presentation: enabled.value ? presentation.value : false,
}))
closeUp()

function setSpring(response: number, dampingRatio: number) {
  Object.assign(commonMotion, { response, dampingRatio })
  for (const profile of Object.values(profiles)) Object.assign(profile, { response, dampingRatio })
}

function closeUp() {
  chart.setRenderBounds({ minX: 0, maxX: 8, minY: null, maxY: null })
}

function reset() {
  enabled.value = true
  followLine.value = true
  maxAxisDistance.value = null
  split.value = false

  Object.assign(commonMotion, { response: 0.105, dampingRatio: 1 })
  Object.assign(profiles.points, { response: 0.105, dampingRatio: 1 })
  Object.assign(profiles.cursor, { response: 0.155, dampingRatio: 1 })
  Object.assign(profiles.anchor, { response: 0.21, dampingRatio: 1 })

  preset.value = 'aligned'
  pivot.value = 'nearest'
  anchor.value = 'pivot'
  closeUp()
}

function formatValue(value: number) {
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
}

function tooltipItems(current: TooltipCtx<ComposedHit>) {
  return current.hits.flatMap(hit => {
    if (hit.kind === 'cursor') return []
    const series = hit.datum.label[0]
    return [{ tag: series, name: `Ряд ${series}`, color: colors[series], value: hit.datum.y }]
  })
}
</script>

<style scoped lang="scss">
.motion-profile {
  margin-top: 10px;

  > b {
    font-size: 12px;
  }
}

.motion-value {
  width: 3.5em;
}

.config {
  white-space: pre-wrap;
}

.presentation-chart :deep(.universal-chart-root .interaction .hover-marker.s2) {
  fill: #ffb057;
}
</style>
