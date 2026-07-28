<template>
  <DebugSection title="Генераторы значений" id="generators"
    description="Генератор решает, какие числа вообще претендуют на подпись. У обоих графиков в values ровно один кандидат — значит, перебора шагов нет, и видно чистое поведение генератора."
    source="src/shared/uiKit/chart/universalChart/labels/autoLabels/generators/">

    <div class="pair-grid">
      <div class="debug-col">
        <div class="debug-row">
          <label class="debug-control">
            <span class="debug-label">step</span>
            <input type="number" min="-20" max="500" step="1" v-model.number="step">
          </label>

          <label class="debug-control">
            <span class="debug-label">offset</span>
            <input type="range" min="-10" max="20" step="1" v-model.number="offset">
            <span class="debug-value">{{ offset }}</span>
          </label>
        </div>

        <div class="debug-row">
          <label class="debug-control">
            <span class="debug-label">диапазон 0…5000</span>
            <input type="checkbox" v-model="wideRange">
          </label>
        </div>

        <ChartStage :chart="steppedChart" :height="170" caption="steppedGenerator({ step, offset })" />
        <ProbeReadout :state="steppedState" />
      </div>

      <div class="debug-col">
        <div class="debug-row">
          <label class="debug-control">
            <span class="debug-label">values</span>
            <input type="text" v-model="rawArray" size="24">
          </label>
        </div>

        <div class="debug-row">
          <button class="debug-btn" @click="rawArray = '0, 5, 7, 30, 31, 55'">по возрастанию</button>
          <button class="debug-btn" @click="rawArray = '55, 31, 30, 7, 5, 0'">наоборот</button>
        </div>

        <ChartStage :chart="arrayChart" :height="170" caption="arrayGenerator([…])" />
        <ProbeReadout :state="arrayState" />
      </div>
    </div>

    <p class="debug-note">
      <b>steppedGenerator</b> — арифметическая прогрессия, выровненная по
      <span class="debug-value">offset</span>: первое значение считается как
      <span class="debug-value">ceil((startFrom − offset) / step) * step + offset</span>. Крути offset при step = 10 —
      сетка целиком уезжает, а не добавляет значения. Обратный генератор — та же формула с отрицательным шагом,
      поэтому массив шагов обязан быть положительным: поставь step = −5 и подписи исчезнут почти полностью
      (значения идут вниз, а проверка пересечения ждёт возрастания).
    </p>

    <p class="debug-note">
      <b>Жёсткий предел — 1000 значений на направление</b> (<span class="debug-value">for (let i = 0; i &lt; 1e3;
        i++)</span>).
      Включи «диапазон 0…5000» при step = 1: подписи кончатся на 1000 и правые четыре пятых оси останутся пустыми,
      без единой ошибки в консоли. В боевом коде это не всплывает только потому, что
      <span class="debug-value">steppedOverrides</span> добирает крупные шаги — но если задать
      <span class="debug-value">values</span> руками одним генератором, ловушка открыта.
    </p>

    <p class="debug-note">
      <b>arrayGenerator</b> отдаёт значения строго в том порядке, в каком они лежат в массиве:
      <span class="debug-value">forward</span> пропускает те, что меньше startFrom, <span
        class="debug-value">backward</span>
      идёт с конца. <b>Массив обязан быть отсортирован по возрастанию</b> — нажми «наоборот»: первое значение съест
      весь диапазон, а остальные отбросятся как «пересекающиеся», хотя на экране они в разных местах. Проверки
      порядка внутри нет.
    </p>

    <p class="debug-note">
      <b>steppedOverrides</b> — не генератор, а сборщик всего массива <span class="debug-value">values</span>: принимает
      число, список чисел или список объектов <span class="debug-value">{ step, labelForValue, padding, strategy
        }</span>
      и дописывает в хвост 10 удвоений последнего шага. Ему же передают варианты одного шага с разным текстом —
      см. секцию про interval.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { arrayGenerator } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/arrayGenerator'
import { steppedGenerator } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'
import { defaultYLabels } from '../shared/options'

const step = ref(10)
const offset = ref(0)
const wideRange = ref(false)
const rawArray = ref('0, 5, 7, 30, 31, 55')

const { state: steppedState, onRender: onSteppedRender } = useProbe()
const { state: arrayState, onRender: onArrayRender } = useProbe()

const shortSeries = syntheticSeries('smooth', 17, 60)
const longSeries = syntheticSeries('smooth', 17, 5000)

const arrayValues = computed(() => rawArray.value
  .split(',')
  .map(item => Number(item.trim()))
  .filter(item => Number.isFinite(item)))

const steppedLabels = computed<LabelsOptions>(() => ({
  values: [steppedGenerator({ step: step.value || 1, offset: offset.value })],
  labelForValue: value => `${value}`,
  padding: 8,
  labelOffset: 5,
  strategy: 'classic',
}))

const arrayLabels = computed<LabelsOptions>(() => ({
  values: [arrayGenerator(arrayValues.value)],
  labelForValue: value => `${value}`,
  padding: 8,
  labelOffset: 5,
  strategy: 'classic',
}))

const steppedChart = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: steppedLabels.value,
  y: defaultYLabels(),
  ticks: { x: 'labels' },
  onRender: onSteppedRender,
}))

const arrayChart = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: arrayLabels.value,
  y: defaultYLabels(),
  ticks: { x: 'labels' },
  onRender: onArrayRender,
}))

watchEffect(() => {
  steppedChart.setPoints(wideRange.value ? longSeries : shortSeries)
  steppedChart.setXLabels(steppedLabels.value)
})

watchEffect(() => {
  arrayChart.setPoints(shortSeries)
  arrayChart.setXLabels(arrayLabels.value)
})
</script>


<style scoped lang="scss">
// min() вместо фиксированного минимума: на узком экране колонка не выпирает за страницу.
.pair-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr));
  gap: 0.75em;
}
</style>
