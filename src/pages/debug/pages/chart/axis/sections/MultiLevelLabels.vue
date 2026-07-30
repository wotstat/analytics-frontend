<template>
  <DebugSection title="Multi-level: месяц → день → час" id="multi-level-labels"
    description="Один кандидат AutoLabels рисует до трёх этажей по X. Все этажи обязаны поместиться; interval-тик каждого уровня доходит ровно до своего этажа, а совпавшие значения дедуплицируются уже в TicksByLabels."
    source="src/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">видимый диапазон</span>
        <input type="range" min="2" max="24" step="1" v-model.number="goodSpanDays">
        <span class="debug-value">{{ goodSpanDays }} дн.</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">slotSize</span>
        <select v-model="slotSize">
          <option value="auto">auto</option>
          <option value="stable">stable</option>
          <option value="max-candidate">max-candidate</option>
          <option value="72">72px</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">levelGap</span>
        <input type="range" min="0" max="16" step="1" v-model.number="levelGap">
        <span class="debug-value">{{ levelGap }}px</span>
      </label>
    </div>

    <ChartStage :chart="goodChart" :height="260" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>этаж</th>
          <th>подписи</th>
          <th>значений тиков</th>
          <th>линий после dedup</th>
          <th>длина наружу</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="level in goodLevels" :key="level.index">
          <th>{{ level.index }}</th>
          <td>{{ labelsAt(goodState, level.index) }}</td>
          <td>{{ level.values.length }}</td>
          <td>{{ level.lines }}</td>
          <td>{{ round(level.suggestedStart) }}px</td>
        </tr>
      </tbody>
    </table>

    <ProbeReadout :state="goodState" ticks :format="formatDateValue" />

    <p class="debug-note">
      Часовой уровень стоит ближе всего к графику, дневной — под ним, месячный — третьим. На общей границе
      <span class="debug-value">01.02 00:00</span> остаётся одна месячная линия: она длиннее дневной и часовой.
      Увеличивай диапазон, чтобы часовой кандидат перестал помещаться и уступил двухэтажному
      <span class="debug-value">день → месяц</span>. В режиме <span class="debug-value">auto</span> слот уменьшится,
      <span class="debug-value">stable</span> сохранит увиденный максимум, а
      <span class="debug-value">max-candidate</span> сразу держит место под три этажа.
    </p>
  </DebugSection>

  <DebugSection title="Multi-level: несовпадающие сетки" id="multi-level-offset"
    description="Календарные часы начинаются в :00, а граница игрового дня сдвинута. Генераторы независимы: кандидат остаётся валидным, близкие тики не снапятся и не дедуплицируются."
    source="src/shared/uiKit/chart/universalChart/ticks/TicksByLabels.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">смещение дня</span>
        <input type="range" min="0" max="6" step="0.5" v-model.number="dayOffsetHours">
        <span class="debug-value">{{ formatOffset(dayOffsetHours) }}</span>
      </label>

      <button class="debug-btn" @click="dayOffsetHours = 0">совместить в 00:00</button>
      <button class="debug-btn" @click="dayOffsetHours = 3.5">сдвинуть в 03:30</button>

      <span class="debug-hint">
        точных совпадений <span class="debug-value">{{ offsetStats.coincidences }}</span> ·
        ближайшие границы <span class="debug-value">{{ offsetStats.distance }}</span>
      </span>
    </div>

    <ChartStage :chart="offsetChart" :height="230" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>этаж</th>
          <th>сетка</th>
          <th>подписи</th>
          <th>значений тиков</th>
          <th>линий после dedup</th>
          <th>длина наружу</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="level in offsetLevels" :key="level.index">
          <th>{{ level.index }}</th>
          <td>{{ level.classes.includes('day-ticks') ? 'игровые дни' : 'календарные часы' }}</td>
          <td>{{ labelsAt(offsetState, level.index) }}</td>
          <td>{{ level.values.length }}</td>
          <td>{{ level.lines }}</td>
          <td>{{ round(level.suggestedStart) }}px</td>
        </tr>
      </tbody>
    </table>

    <ProbeReadout :state="offsetState" ticks :format="formatDateValue" />

    <p class="debug-note">
      При нулевом смещении дневной тик забирает совпавший часовой и проходит два этажа. При
      <span class="debug-value">03:30</span> длинная дневная линия честно оказывается внутри часового интервала:
      движок проверяет только размещение подписей каждого этажа и не требует вложенности генераторов.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import type {
  LabelLevelOptions,
  LabelStepOverrides,
  Options as LabelsOptions,
  Strategy,
} from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedGenerator } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import type { SlotSize } from '@/shared/uiKit/chart/universalChart/labels/BaseLabels'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { useProbe, type ProbeState } from '../shared/probe'
import { defaultYLabels } from '../shared/options'

const HOUR = 60 * 60
const DAY = 24 * HOUR
const GOOD_START = Date.UTC(2026, 0, 29) / 1000
const GOOD_DATA_END = GOOD_START + 24 * DAY
const OFFSET_START = Date.UTC(2026, 1, 1) / 1000
const OFFSET_END = OFFSET_START + 2 * DAY
const MONTH_NAMES = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

const intervalStrategy: Strategy = { type: 'interval', placement: 'start', fit: true, offset: 4 }
const goodSpanDays = ref(6)
const slotSize = ref<'auto' | 'stable' | 'max-candidate' | '72'>('max-candidate')
const levelGap = ref(4)
const dayOffsetHours = ref(3.5)

const { state: goodState, onRender: onGoodRender } = useProbe()
const { state: offsetState, onRender: onOffsetRender } = useProbe()

const goodPoints = makePoints(GOOD_START, GOOD_DATA_END, 3 * HOUR)
const offsetPoints = makePoints(OFFSET_START, OFFSET_END, HOUR)

const goodSlotSize = computed<SlotSize>(() => slotSize.value === '72' ? 72 : slotSize.value)

const monthLevel: LabelLevelOptions = {
  gen: utcMonthGenerator,
  labelForValue: value => MONTH_NAMES[new Date(value * 1000).getUTCMonth()],
  keyForValue: value => `${value}`,
  strategy: intervalStrategy,
  classes: 'month-labels',
  ticks: { gen: 'labels', classes: 'month-ticks' },
}

const dayLevel: LabelLevelOptions = {
  gen: steppedGenerator({ step: DAY }),
  labelForValue: value => `${new Date(value * 1000).getUTCDate()} день`,
  keyForValue: value => `${value}`,
  strategy: intervalStrategy,
  classes: 'day-labels',
  ticks: { gen: 'labels', classes: 'day-ticks' },
}

const goodXLabels = computed<LabelsOptions>(() => ({
  values: [
    hourCandidate(3),
    hourCandidate(6),
    hourCandidate(12),
    {
      ...dayLevel,
      secondary: [monthLevel],
    },
  ],
  padding: 6,
  labelOffset: 5,
  levelGap: levelGap.value,
  slotSize: goodSlotSize.value,
  from: Date.UTC(2026, 0, 1) / 1000,
  to: Date.UTC(2026, 2, 1) / 1000,
}))

const offsetXLabels = computed<LabelsOptions>(() => {
  const offset = dayOffsetHours.value * HOUR
  const offsetDayLevel: LabelLevelOptions = {
    gen: steppedGenerator({ step: DAY, offset }),
    labelForValue: value => `день ${String(new Date(value * 1000).getUTCDate()).padStart(2, '0')}`,
    keyForValue: value => `${value}`,
    strategy: intervalStrategy,
    classes: 'day-labels',
    ticks: { gen: 'labels', classes: 'day-ticks' },
  }

  return {
    values: [{
      gen: steppedGenerator({ step: 3 * HOUR }),
      labelForValue: formatHour,
      keyForValue: value => `${value}`,
      strategy: intervalStrategy,
      classes: 'hour-labels',
      ticks: { gen: 'labels', classes: 'hour-ticks' },
      secondary: [offsetDayLevel],
    }],
    padding: 6,
    labelOffset: 5,
    levelGap: 4,
    slotSize: 'max-candidate',
    from: OFFSET_START - DAY,
    to: OFFSET_END + DAY,
  }
})

const goodChart = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: goodXLabels.value,
  y: defaultYLabels(),
  ticks: { x: 'labels', y: 'labels', classes: 'multi-level-grid' },
  clipLabels: true,
  onRender: onGoodRender,
}))

const offsetChart = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: offsetXLabels.value,
  y: defaultYLabels(),
  ticks: { x: 'labels', y: 'labels', classes: 'multi-level-grid' },
  clipLabels: true,
  onRender: onOffsetRender,
}))

watchEffect(() => {
  goodChart
    .setPoints(goodPoints)
    .setXLabels(goodXLabels.value)
    .setRenderBounds({ minX: GOOD_START, maxX: GOOD_START + goodSpanDays.value * DAY })
})

watchEffect(() => {
  offsetChart
    .setPoints(offsetPoints)
    .setXLabels(offsetXLabels.value)
    .setRenderBounds({ minX: OFFSET_START, maxX: OFFSET_END })
})

const goodLevels = computed(() => goodState.value?.xLevels ?? [])
const offsetLevels = computed(() => offsetState.value?.xLevels ?? [])

const offsetStats = computed(() => {
  const hourValues = levelValues(offsetState.value, 'hour-ticks')
  const dayValues = levelValues(offsetState.value, 'day-ticks')
  const hourSet = new Set(hourValues)
  const coincidences = dayValues.filter(value => hourSet.has(value)).length

  let distance = Infinity
  for (const day of dayValues) {
    for (const hour of hourValues) distance = Math.min(distance, Math.abs(day - hour))
  }

  return {
    coincidences,
    distance: Number.isFinite(distance) ? formatDuration(distance) : '—',
  }
})

function hourCandidate(step: number): LabelStepOverrides {
  return {
    gen: steppedGenerator({ step: step * HOUR }),
    labelForValue: formatHour,
    keyForValue: value => `${value}`,
    strategy: intervalStrategy,
    classes: 'hour-labels',
    ticks: { gen: 'labels', classes: 'hour-ticks' },
    secondary: [dayLevel, monthLevel],
  }
}

function utcMonthGenerator(startFrom: number) {
  const start = new Date(startFrom * 1000)
  const floor = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1) / 1000
  const ceil = floor < startFrom
    ? Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) / 1000
    : floor

  const generate = function* (initial: number, direction: 1 | -1) {
    let current = new Date(initial * 1000)
    for (let index = 0; index < 1000; index++) {
      yield current.getTime() / 1000
      current = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + direction, 1))
    }
  }

  return {
    forward: generate(ceil, 1),
    backward: generate(floor, -1),
  }
}

function makePoints(from: number, to: number, step: number) {
  return Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, index) => ({
    x: from + index * step,
    y: 50 + Math.sin(index / 4) * 18 + Math.cos(index / 11) * 7,
  }))
}

function formatHour(value: number) {
  return `${String(new Date(value * 1000).getUTCHours()).padStart(2, '0')}:00`
}

function formatDateValue(value: number) {
  const date = new Date(value * 1000)
  return `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
}

function labelsAt(state: ProbeState | null, level: number) {
  const labels = state?.x.filter(label => label.level === level).map(label => label.text) ?? []
  return labels.length > 0 ? labels.join(' · ') : '—'
}

function levelValues(state: ProbeState | null, className: string) {
  return state?.xLevels.find(level => level.classes.includes(className))?.values ?? []
}

function formatOffset(value: number) {
  const hours = Math.floor(value)
  const minutes = Math.round((value - hours) * 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatDuration(value: number) {
  const hours = Math.floor(value / HOUR)
  const minutes = Math.round((value - hours * HOUR) / 60)
  return hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`
}

function round(value: number) {
  return Math.round(value * 10) / 10
}
</script>


<style scoped lang="scss">
:deep(.universal-chart-root) {
  .hour-labels .label {
    fill: rgba(255, 255, 255, 0.88);
  }

  .day-labels .label {
    fill: rgba(255, 205, 125, 0.95);
  }

  .month-labels .label {
    fill: rgba(125, 205, 255, 1);
  }

  .multi-level-grid {
    .hour-ticks {
      stroke: rgba(255, 255, 255, 0.18);
    }

    .day-ticks {
      stroke: rgba(255, 205, 125, 0.55);
    }

    .month-ticks {
      stroke: rgba(125, 205, 255, 0.8);
    }
  }
}
</style>
