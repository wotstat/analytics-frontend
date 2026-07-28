<template>
  <DebugSection title="Bar: радиусы углов во всех формах" id="bar-radius"
    description="Одно и то же значение в четырёх формах записи даёт разные углы. Проверяй, что скруглился именно тот угол, что задан, и что радиус больше половины ширины столбца не разрывает фигуру, а ужимается."
    source="src/shared/uiKit/chart/universalChart/plot/bar/Bar.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">strategy</span>
        <select v-model="type">
          <option value="grouped">grouped</option>
          <option value="stacked">stacked</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">значения</span>
        <select v-model="signed">
          <option :value="false">только положительные</option>
          <option :value="true">со знаком</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">padding</span>
        <input type="range" min="0" max="0.9" step="0.05" v-model.number="padding">
        <span class="debug-value">{{ padding.toFixed(2) }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">maxWidth</span>
        <input type="range" min="0" max="120" step="1" v-model.number="maxWidth">
        <span class="debug-value">{{ maxWidth === 0 ? 'не задан' : `${maxWidth}px` }}</span>
      </label>
    </div>

    <RadiusControl v-model="radius" label="radius" />
    <RadiusControl v-model="innerRadius" label="innerRadius" v-if="type === 'stacked'" />

    <ChartStage :chart="instance.chart" :height="260" />

    <p class="debug-note">
      <b>Число — не «все углы».</b> В <span class="debug-value">radius</span> число скругляет только внешнюю пару:
      верхние углы у положительного столбца и нижние у отрицательного (включи «со знаком» и сравни). А то же самое
      число в <span class="debug-value">innerRadius</span> скругляет все четыре угла — у внутренних сегментов стопки
      внешних углов нет.
    </p>

    <p class="debug-note">
      Пара — это <span class="debug-value">[верх, низ]</span>, четвёрка — по часовой стрелке от левого верхнего,
      как в CSS: <span class="debug-value">[tl, tr, br, bl]</span>. В объектной форме углы разрешаются по цепочке
      <span class="debug-value">topLeft ?? top ?? left ?? 0</span>: задай только
      <span class="debug-value">left</span> — скруглятся оба левых угла, добавь
      <span class="debug-value">topLeft</span> — он перебьёт.
    </p>

    <p class="debug-note">
      Ограничители: каждый радиус зажимается половиной ширины столбца, а если сумма верхнего и нижнего радиусов по
      одной стороне выше самого столбца, оба ужимаются пропорционально. Крути maxWidth в ноль вместе с большим
      радиусом — фигура обязана оставаться замкнутой.
    </p>

    <p class="debug-note">
      В stacked внешний радиус достаётся только крайнему сегменту стопки (верхнему у положительных, нижнему у
      отрицательных), остальным — <span class="debug-value">innerRadius</span>. Если в категории остался один
      сегмент, он одновременно и крайний, и единственный: сверху внешний радиус, снизу — ничего.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticBarDatasets } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { Bar, type BarDataset, type BarRadius, type BarStrategy } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../../shared/ChartStage.vue'
import { useChartInstance } from '../../shared/useChartInstance'
import RadiusControl from './RadiusControl.vue'

const seriesClasses = ['series-a', 'series-b', 'series-c']

const type = ref<'grouped' | 'stacked'>('stacked')
const signed = ref(false)
const padding = ref(0.35)
const maxWidth = ref(0)
const radius = ref<BarRadius>(6)
const innerRadius = ref<BarRadius>(0)

const datasets = computed<BarDataset[]>(() => {
  const raw = syntheticBarDatasets(3, 6, 7)

  return raw.map((dataset, datasetIndex) => ({
    classes: seriesClasses[datasetIndex % seriesClasses.length],
    values: dataset.values.map((value, index) => signed.value && index % 3 === 1 ? -value : value),
  }))
})

const strategy = computed<BarStrategy>(() => {
  const base = { padding: padding.value, maxWidth: maxWidth.value, radius: radius.value }

  return type.value === 'grouped'
    ? { type: 'grouped', innerPadding: 0.1, ...base }
    : { type: 'stacked', innerPadding: 2, innerRadius: innerRadius.value, ...base }
})

const { instance } = useChartInstance(build)

function build() {
  const bar = new Bar({ classes: 'bars', strategy: strategy.value })

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    minLayoutSize: 4,
  }).addPlot(bar, 'plot')

  return { chart, bar }
}

watchEffect(() => {
  const { bar } = instance.value
  bar.setStrategy(strategy.value)
  bar.setDatasets(datasets.value)
})

</script>
