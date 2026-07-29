<template>
  <DebugSection title="Четыре стратегии на одних данных" id="strategies"
    description="Одинаковые данные, одинаковая ширина, одинаковый список шагов — меняется только strategy. Тики стоят на значениях подписей, поэтому сразу видно, где текст привязан к самому значению, а где сдвинут."
    source="src/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" min="220" max="900" step="10" v-model.number="width">
        <span class="debug-value">{{ width }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">padding</span>
        <input type="range" min="0" max="40" step="1" v-model.number="padding">
        <span class="debug-value">{{ padding }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">формат</span>
        <select v-model="format">
          <option v-for="item in labelFormats" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">onlyFitted</span>
        <input type="checkbox" v-model="onlyFitted">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">interval: placement</span>
        <select v-model="intervalPlacement">
          <option value="start">start</option>
          <option value="middle">middle</option>
          <option value="end">end</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">interval: fit</span>
        <input type="checkbox" v-model="intervalFit">
      </label>

      <label class="debug-control">
        <span class="debug-label">cell: size</span>
        <input type="number" min="0.25" max="10" step="0.25" v-model.number="cellSize">
      </label>

      <label class="debug-control">
        <span class="debug-label">cell: placement</span>
        <select v-model="cellPlacement">
          <option value="start">start</option>
          <option value="middle">middle</option>
          <option value="end">end</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">cell: flow</span>
        <input type="checkbox" v-model="cellFlow">
      </label>
    </div>

    <div class="strategy-grid">
      <div class="debug-col" v-for="(variant, index) in variants" :key="variant.key">
        <ChartStage :chart="charts[index]" :width="width" :height="170" :caption="variant.title" />
        <ProbeReadout :state="probes[index].state.value" />
      </div>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>стратегия</th>
          <th>куда встаёт подпись</th>
          <th>когда схлопывается</th>
          <th>края</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>classic</th>
          <td>центр на значении</td>
          <td>пересечение с соседом + padding</td>
          <td>ничего не делает: крайняя подпись торчит или обрезается</td>
        </tr>
        <tr>
          <th>classic-flow</th>
          <td>центр на значении</td>
          <td>то же</td>
          <td>extend + fit прижимают крайние внутрь области</td>
        </tr>
        <tr>
          <th>interval</th>
          <td>внутри отрезка между соседними значениями</td>
          <td>ширина отрезка меньше ширины текста</td>
          <td>fit подтягивает подпись видимой части отрезка</td>
        </tr>
        <tr>
          <th>cell</th>
          <td>относительно базовой ячейки [v, v + size]</td>
          <td>как в classic — по соседям</td>
          <td>по умолчанию ничего; flow включает extend + fit</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Разница <b>classic</b> и <b>classic-flow</b> видна только по краям: сузь сцену и смотри на первую и последнюю
      подпись. У flow они наезжают на границу области и останавливаются, у classic — уходят за неё. Ползунок
      <span class="debug-value">padding</span> у flow работает как два разных числа:
      <span class="debug-value">padding.clip</span> отвечает за отказ от шага, <span
        class="debug-value">padding.flow</span> —
      за зазор при прижатии. В объектной форме их задают раздельно.
    </p>

    <p class="debug-note">
      <b>onlyFitted</b> в docs не описан: он выбрасывает подписи, которые не влезли целиком в допустимую область
      (<span class="debug-value">cleanupOutside</span>). Включи его вместе с classic — крайние подписи исчезнут вместо
      того чтобы торчать. При этом тики остаются: в major-уровень итога кадра
      (<span class="debug-value">getTickLevels()[0]</span>) значения попадают <b>до</b> отсечения.
    </p>

    <p class="debug-note">
      У <b>interval</b> значение по умолчанию <span class="debug-value">placement: 'start'</span>, а у
      <b>cell</b> — <span class="debug-value">'middle'</span>. Стратегия по умолчанию для всего AutoLabels —
      <span class="debug-value">'classic-flow'</span>. Ни то, ни другое в docs не указано.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { Options as LabelsOptions, Strategy } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'
import { formatLabel, labelFormats, type LabelFormat } from '../shared/formats'

const variants = [
  { key: 'classic', title: 'strategy: \'classic\'' },
  { key: 'classic-flow', title: 'strategy: \'classic-flow\'' },
  { key: 'interval', title: '{ type: \'interval\' }' },
  { key: 'cell', title: '{ type: \'cell\', size }' },
] as const

const width = ref(340)
const padding = ref(10)
const format = ref<LabelFormat>('plain')
const onlyFitted = ref(false)
const intervalPlacement = ref<'start' | 'middle' | 'end'>('start')
const intervalFit = ref(false)
const cellSize = ref(1)
const cellPlacement = ref<'start' | 'middle' | 'end'>('middle')
const cellFlow = ref(false)

const points = syntheticSeries('smooth', 11, 40)

const probes = variants.map(() => useProbe())
const charts = variants.map((variant, index) => markRaw(new LabelsChart({
  axes: { bottom: 'space' },
  x: { values: [], strategy: 'classic' },
  ticks: { x: 'labels' },
  minLayoutSize: { left: 10, right: 10, top: 8 },
  onRender: probes[index].onRender,
})))

const strategies = computed<Strategy[]>(() => [
  'classic',
  'classic-flow',
  { type: 'interval', placement: intervalPlacement.value, fit: intervalFit.value },
  { type: 'cell', size: cellSize.value || 1, placement: cellPlacement.value, flow: cellFlow.value },
])

function optionsFor(strategy: Strategy, kind: LabelFormat): LabelsOptions {
  return {
    values: steppedOverrides({ step: [1, 2, 5, 10] }),
    labelForValue: value => formatLabel(kind, value),
    padding: padding.value,
    labelOffset: 5,
    onlyFitted: onlyFitted.value,
    strategy,
  }
}

watchEffect(() => {
  const kind = format.value

  strategies.value.forEach((strategy, index) => {
    charts[index].setPoints(points)
    charts[index].setXLabels(optionsFor(strategy, kind))
  })
})
</script>


<style scoped lang="scss">
.strategy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 0.75em;
}
</style>
