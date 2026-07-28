<template>
  <DebugSection title="cell: подписи колонок bar-графика" id="cell"
    description="Настоящий bar-график: колонка № i занимает координаты [i, i + 1], тики нарисованы по границам ячеек. Подпись позиционируется относительно базовой ячейки [v, v + size] — а не относительно текущего шага, поэтому при схлопывании она остаётся по центру своей колонки."
    source="src/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels.ts → getValueOffset">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" min="200" max="1100" step="10" v-model.number="width">
        <span class="debug-value">{{ width }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">колонок</span>
        <input type="range" min="3" max="40" step="1" v-model.number="columns">
        <span class="debug-value">{{ columns }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">рядов</span>
        <input type="range" min="1" max="3" step="1" v-model.number="datasets">
        <span class="debug-value">{{ datasets }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">подпись</span>
        <select v-model="naming">
          <option value="index">номер</option>
          <option value="short">К1, К2…</option>
          <option value="long">Колонка № 1…</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">size</span>
        <input type="number" min="0.25" max="6" step="0.25" v-model.number="size">
      </label>

      <label class="debug-control">
        <span class="debug-label">placement</span>
        <select v-model="placement">
          <option value="start">start</option>
          <option value="middle">middle</option>
          <option value="end">end</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">flow</span>
        <input type="checkbox" v-model="flow">
      </label>

      <label class="debug-control">
        <span class="debug-label">to</span>
        <select v-model="toMode">
          <option value="last">индекс последней колонки ({{ columns - 1 }})</option>
          <option value="edge">правый край ({{ columns }})</option>
          <option value="none">не задан</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">padding</span>
        <input type="range" min="0" max="40" step="1" v-model.number="padding">
        <span class="debug-value">{{ padding }}</span>
      </label>
    </div>

    <ChartStage :chart="chart" :width="width" :height="200" />

    <ProbeReadout :state="state" />

    <p class="debug-note">
      <b>Проверка неочевидного места из docs.</b> Значения подписей здесь — левые границы ячеек, а
      <span class="debug-value">to</span> сравнивается в <span class="debug-value">calculateClassic</span> с сырым
      значением генератора, <b>до</b> прибавления <span class="debug-value">size / 2</span>. Поэтому у cell
      <span class="debug-value">to</span> — это индекс последней колонки. Переключи на «правый край»: появится лишняя
      подпись «{{ columns + 1 }}» за последней колонкой — движок честно считает, что колонка с индексом
      {{ columns }} тоже существует. Docs описывают это правильно.
    </p>

    <p class="debug-note">
      Сужай сцену и следи за числами: шаг растёт 1 → 2 → 4, но каждая оставшаяся подпись стоит ровно по центру
      <b>своей</b> колонки, а не по центру нового укрупнённого интервала. Для широких подписей это значит, что текст
      вылезает за границы колонки и на глаз перестаёт к ней относиться — плата за то, что число всегда указывает на
      свой столбец.
    </p>

    <p class="debug-note">
      <b>size не связан с реальной шириной колонки</b> — это просто число, на половину которого сдвигается подпись.
      Поставь size = 3 при колонках шириной 1: подписи уедут на полторы колонки вправо и перестанут соответствовать
      столбцам. Ошибку никто не поймает, кроме глаза.
    </p>

    <p class="debug-note">
      Флаг <span class="debug-value">flow</span> у cell в docs не описан: он включает тот же
      <span class="debug-value">extend + fit</span>, что и у classic-flow, и прижимает крайние подписи к границам
      области. Полезно, когда первая подпись торчит влево за ось.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticBarDatasets } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'
import { defaultYLabels } from '../shared/options'

const width = ref(700)
const columns = ref(12)
const datasets = ref(2)
const naming = ref<'index' | 'short' | 'long'>('index')
const size = ref(1)
const placement = ref<'start' | 'middle' | 'end'>('middle')
const flow = ref(false)
const toMode = ref<'last' | 'edge' | 'none'>('last')
const padding = ref(8)

const { state, onRender } = useProbe()

const barDatasets = computed(() => syntheticBarDatasets(datasets.value, columns.value, 21))
const boundaries = computed(() => Array.from({ length: columns.value + 1 }, (_, index) => index))

const xLabels = computed<LabelsOptions>(() => {
  const kind = naming.value

  const labelForValue = (value: number) => {
    const index = Math.round(value) + 1
    if (kind === 'short') return `К${index}`
    if (kind === 'long') return `Колонка № ${index}`
    return `${index}`
  }

  const to = (() => {
    if (toMode.value === 'last') return columns.value - 1
    if (toMode.value === 'edge') return columns.value
    return undefined
  })()

  return {
    values: steppedOverrides({ step: [1, 2, 4, 8] }),
    labelForValue,
    padding: padding.value,
    labelOffset: 5,
    strategy: { type: 'cell', size: size.value || 1, placement: placement.value, flow: flow.value },
    from: 0,
    to,
  }
})

const chart = markRaw(new LabelsChart({
  plot: 'bar',
  barStrategy: { type: 'grouped', padding: 0.25, innerPadding: 0.1, radius: 2 },
  axes: { bottom: 'space', left: 'space' },
  x: xLabels.value,
  y: defaultYLabels(),
  ticks: { x: 'values' },
  onRender,
}))

watchEffect(() => {
  chart.setDatasets(barDatasets.value)
  chart.setTickValues('horizontal', boundaries.value)
  chart.setXLabels(xLabels.value)
})
</script>
