<template>
  <DebugSection title="Тики: по значениям и по подписям" id="ticks"
    description="Слева тики заданы списком чисел, справа их значения приходят из подписей. Данные и размеры одинаковые — разница только в источнике значений и в том, кто управляет длиной штриха."
    source="src/shared/uiKit/chart/universalChart/ticks/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">значения для TicksByValues</span>
        <input type="text" v-model="rawValues" size="28">
      </label>

      <button class="debug-btn" @click="rawValues = '0, 10, 20, 30, 40, 50'">ровный шаг</button>
      <button class="debug-btn" @click="rawValues = '0, 3, 4, 5, 21, 22, 55'">неровные</button>
      <button class="debug-btn" @click="rawValues = '-40, -10, 0, 30, 90, 500'">часть вне bounds</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">start</span>
        <input type="range" min="-60" max="120" step="1" v-model.number="start">
        <span class="debug-value">{{ start }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">end: авто</span>
        <input type="checkbox" v-model="autoEnd">
      </label>

      <label class="debug-control" v-if="!autoEnd">
        <span class="debug-label">end</span>
        <input type="range" min="-60" max="200" step="1" v-model.number="end">
        <span class="debug-value">{{ end }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">стратегия подписей справа</span>
        <select v-model="strategy">
          <option value="classic-flow">classic-flow</option>
          <option value="interval">interval</option>
        </select>
      </label>
    </div>

    <div class="debug-grid">
      <div class="debug-col">
        <ChartStage :chart="chartValues" :height="200" caption="TicksByValues — список чисел" />
        <ProbeReadout :state="valuesState" ticks />
      </div>

      <div class="debug-col">
        <ChartStage :chart="chartLabels" :height="200" caption="TicksByLabels — значения от подписей" />
        <ProbeReadout :state="labelsState" ticks />
      </div>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>значение</th>
          <th>start (ближний конец штриха)</th>
          <th>end (дальний конец)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>null</th>
          <td>как 0</td>
          <td>до дальнего края области — полноценная линия сетки</td>
        </tr>
        <tr>
          <th>≥ 0</th>
          <td>от линии оси наружу от области на N пикселей</td>
          <td>от линии оси внутрь области на N пикселей</td>
        </tr>
        <tr>
          <th>&lt; 0</th>
          <td>от внешнего края SVG внутрь на |N|</td>
          <td>от дальнего края области внутрь на |N|</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Линия оси для горизонтальных тиков — низ области данных, для вертикальных — левый край. Из таблицы следует
      неочевидное: <span class="debug-value">start = −1</span> — это не «на пиксель короче», а штрих до самого низа
      картинки, сквозь подписи. Оба конца дополнительно зажимаются в границы SVG и области, поэтому огромные значения
      просто упираются в край.
    </p>

    <p class="debug-note">
      Ползунок <b>start</b> работает только на левом графике. У <span class="debug-value">TicksByLabels</span> он не
      настраивается вовсе: <span class="debug-value">getTicks()</span> на каждом кадре кладёт в
      <span class="debug-value">sizes.start</span> значение <span class="debug-value">labels.getTicksOffset()</span>,
      затирая заданное. Это не недосмотр — длина штриха привязана к стратегии подписей (у interval она даёт
      <span class="debug-value">Infinity</span>, отсюда сквозные разделители). А вот то, что конструктор при этом
      молча принимает <span class="debug-value">start</span>, сбивает с толку: в бою его передают, и он ничего
      не делает. Сам ползунок — это подкласс на стороне стенда: <span class="debug-value">sizes</span> в движке
      <span class="debug-value">protected</span>, и открывать его наружу ради одного стенда незачем.
    </p>

    <p class="debug-note">
      Переключи стратегию справа на <b>interval</b>: <span class="debug-value">getTicksOffset()</span> отдаёт
      <span class="debug-value">Infinity</span>, и штрихи мгновенно вырастают до самого низа SVG — сквозь зону подписей.
      Так сделаны «недельные» разделители в лидерборде Натиска. У <span class="debug-value">classic</span> и
      <span class="debug-value">cell</span> смещение всегда 4, у прочего — 0.
    </p>

    <p class="debug-note">
      Значения, которые не попали в текущие bounds, отсекаются в <span class="debug-value">BaseTicks.getTicks</span> по
      пиксельной координате — нажми «часть вне bounds», в readout останутся только видимые. И ещё: у
      <span class="debug-value">.tick</span> в <span class="debug-value">style.scss</span> движка нет ни stroke, ни
      толщины — без внешних стилей тики просто невидимы, хотя элементы в DOM есть.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'
import { defaultYLabels } from '../shared/options'

const rawValues = ref('0, 10, 20, 30, 40, 50')
const start = ref(4)
const end = ref(0)
const autoEnd = ref(true)
const strategy = ref<'classic-flow' | 'interval'>('classic-flow')

const points = syntheticSeries('smooth', 5, 60)

const { state: valuesState, onRender: onValuesRender } = useProbe()
const { state: labelsState, onRender: onLabelsRender } = useProbe()

const tickValues = computed(() => rawValues.value
  .split(',')
  .map(item => Number(item.trim()))
  .filter(item => Number.isFinite(item)))

const xLabels = computed<LabelsOptions>(() => {
  if (strategy.value === 'interval') return {
    values: steppedOverrides({ step: [5, 10, 25] }),
    labelForValue: value => `${value}`,
    padding: 10,
    labelOffset: 5,
    strategy: { type: 'interval', placement: 'middle', fit: true },
    from: 0,
    to: 59,
  }

  return {
    values: steppedOverrides({ step: [5, 10, 25] }),
    labelForValue: value => `${value}`,
    padding: 10,
    labelOffset: 5,
    strategy: 'classic-flow',
  }
})

const chartValues = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: xLabels.value,
  y: defaultYLabels(),
  ticks: { x: 'values' },
  onRender: onValuesRender,
}))

const chartLabels = markRaw(new LabelsChart({
  axes: { bottom: 'space', left: 'space' },
  x: xLabels.value,
  y: defaultYLabels(),
  ticks: { x: 'labels' },
  onRender: onLabelsRender,
}))

watchEffect(() => {
  const tickEnd = autoEnd.value ? null : end.value

  chartValues.setPoints(points)
  chartValues.setXLabels(xLabels.value)
  chartValues.setTickValues('horizontal', tickValues.value)
  chartValues.setTickOffsets('horizontal', start.value, tickEnd)

  chartLabels.setPoints(points)
  chartLabels.setXLabels(xLabels.value)
  chartLabels.setTickOffsets('horizontal', start.value, tickEnd)
})
</script>
