<template>
  <DebugSection title="Приоритеты внутри одного этажа" id="priority-labels"
    description="Три бесконечных источника с шагами 24, 10 и 1. A вытесняет B и C, B вытесняет C. Стратегия общая; отступы, onlyFitted и тики можно менять у отдельного источника."
    source="src/shared/uiKit/chart/universalChart/labels/autoLabels/priorityLabels.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">начало диапазона</span>
        <input type="number" min="0" max="1000" step="0.25" v-model.number="start">
      </label>
      <label class="debug-control">
        <span class="debug-label">длина диапазона</span>
        <input type="range" min="20" max="200" v-model.number="span">
        <span class="debug-value">{{ span }}</span>
      </label>
      <label class="debug-control">
        <span class="debug-label">стратегия этажа</span>
        <select v-model="strategy">
          <option value="classic-flow">classic-flow</option>
          <option value="classic">classic</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">C: clip</span>
        <input type="range" min="0" max="60" v-model.number="clipPadding">
        <span class="debug-value">{{ clipPadding }}</span>
      </label>
      <label class="debug-control">
        <span class="debug-label">C: flow</span>
        <input type="range" min="0" max="60" v-model.number="flowPadding">
        <span class="debug-value">{{ flowPadding }}</span>
      </label>
      <label class="debug-control">
        <span class="debug-label">C: onlyFitted</span>
        <input type="checkbox" v-model="onlyFitted">
      </label>
      <label class="debug-control">
        <span class="debug-label">C: тики</span>
        <input type="checkbox" v-model="showTicks">
      </label>
    </div>

    <ChartStage class="priority-stage" :chart="chart" :width="760" :height="150" />

    <p class="debug-note">
      A: padding = 12, B: padding = 8. Зазор пары — максимум её отступов.
      Тики A показывают все значения источника, B и C — выбранные подписи.
      При смене начала диапазона внутренние подписи должны сохраняться; flow сдвигает их у края.
      onlyFitted у C скрывает его неполные подписи, сохраняя их влияние на отбор и тики.
    </p>
    <ProbeReadout :state="state" ticks />
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import type { Options } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'

const start = ref(0)
const span = ref(100)
const strategy = ref<'classic' | 'classic-flow'>('classic-flow')
const clipPadding = ref(4)
const flowPadding = ref(4)
const onlyFitted = ref(false)
const showTicks = ref(true)
const { state, onRender } = useProbe()

const labels = computed<Options>(() => ({
  values: [{
    priorities: [
      { source: { step: 24 }, labelForValue: value => `A ${value}`, classes: 'priority-a', padding: 12,
        ticks: { source: { step: 24 }, classes: 'priority-a' } },
      { source: { step: 10 }, labelForValue: value => `B ${value}`, classes: 'priority-b', padding: 8,
        ticks: { source: 'labels', classes: 'priority-b' } },
      { source: { step: 1 }, labelForValue: value => `C ${value}`, classes: 'priority-c',
        padding: { clip: clipPadding.value, flow: flowPadding.value }, onlyFitted: onlyFitted.value,
        ticks: showTicks.value ? { source: 'labels', classes: 'priority-c' } : [] },
    ],
    maxLabelSize: 100,
    strategy: strategy.value,
  }],
  onlyFitted: false,
  labelOffset: 10,
}))

const chart = markRaw(new LabelsChart({
  x: labels.value,
  xSlot: 'top',
  plot: 'none',
  axes: { top: 'space', bottom: 'space' },
  ticks: { x: 'labels', start: 0 },
  clipLabels: true,
  onRender,
}))

watchEffect(() => chart.setXLabels(labels.value))
watchEffect(() => chart.setRenderBounds({ minX: start.value, maxX: start.value + span.value, minY: 0, maxY: 1 }))
</script>


<style scoped lang="scss">
.priority-stage :deep(.universal-chart-root) {
  .priority-a { color: #ffce73; }
  .priority-b { color: #7cc7ff; }
  .priority-c { color: #a2d99e; }

  .label { fill: currentColor; }
  .tick { stroke: currentColor; stroke-width: 1; opacity: 0.5; }
}
</style>
