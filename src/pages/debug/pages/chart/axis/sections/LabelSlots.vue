<template>
  <DebugSection title="Размещение подписей по сторонам" id="label-slots"
    description="Горизонтальные подписи можно независимо поставить сверху и снизу, вертикальные — слева и справа. Каждая сторона получает свой renderer, поэтому допустима любая комбинация, включая все четыре или ни одной."
    source="src/shared/uiKit/chart/universalChart/labels/BaseLabels.ts">

    <div class="debug-row">
      <label class="debug-control" v-for="side in sideList" :key="side.value">
        <span class="debug-label">{{ side.label }}</span>
        <input type="checkbox" v-model="enabled[side.value]">
      </label>

      <button class="debug-btn" @click="setAll(true)">включить все</button>
      <button class="debug-btn" @click="setAll(false)">убрать все</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">layoutVariant</span>
        <select v-model="layoutVariant">
          <option value="vertical">vertical</option>
          <option value="horizontal">horizontal</option>
          <option value="square">square</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">strategy</span>
        <select v-model="strategy">
          <option value="classic-flow">classic-flow</option>
          <option value="classic">classic</option>
          <option value="cell">cell</option>
          <option value="interval">interval</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">labelOffset</span>
        <input type="range" min="0" max="40" step="1" v-model.number="labelOffset">
        <span class="debug-value">{{ labelOffset }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">clip графика</span>
        <input type="checkbox" v-model="clipPlot">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">renderBounds.minX</span>
        <input type="range" min="-60" :max="maxX - 0.1" step="0.1" v-model.number="minX">
        <span class="debug-value">{{ minX.toFixed(1) }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">renderBounds.maxX</span>
        <input type="range" :min="minX + 0.1" max="120" step="0.1" v-model.number="maxX">
        <span class="debug-value">{{ maxX.toFixed(1) }}</span>
      </label>
    </div>

    <ChartStage :chart="chart" :height="260" />

    <ProbeReadout :state="state" axis="both" />

    <p class="debug-note">
      <span class="debug-value">labelOffset</span> измеряется от границы области построения до ближайшего края текста:
      вниз для <b>bottom</b>, вверх для <b>top</b>, влево для <b>left</b> и вправо для <b>right</b>.
      Противоположные стороны используют одинаковые значения и шаги, но рисуются независимыми экземплярами
      <span class="debug-value">AutoLabels</span>.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { Strategy } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import {
  LabelsChart,
  type LayoutVariant,
  type XLabelsSlot,
  type YLabelsSlot,
} from '../shared/LabelsChart'
import { defaultXLabels, defaultYLabels } from '../shared/options'
import { useProbe } from '../shared/probe'

const sideList = [
  { value: 'bottom', label: 'снизу' },
  { value: 'top', label: 'сверху' },
  { value: 'left', label: 'слева' },
  { value: 'right', label: 'справа' },
] as const

type Side = typeof sideList[number]['value']

const enabled = ref<Record<Side, boolean>>({
  top: false,
  right: false,
  bottom: true,
  left: true,
})
const labelOffset = ref(5)
const minX = ref(0)
const maxX = ref(59)
const clipPlot = ref(true)
const layoutVariant = ref<LayoutVariant>('square')
const strategy = ref<'classic-flow' | 'classic' | 'cell' | 'interval'>('classic-flow')
const points = syntheticSeries('smooth', 31, 60)
const { state, onRender } = useProbe()

const xSlots = computed<XLabelsSlot[]>(() => [
  ...(enabled.value.bottom ? ['bottom' as const] : []),
  ...(enabled.value.top ? ['top' as const] : []),
])

const ySlots = computed<YLabelsSlot[]>(() => [
  ...(enabled.value.left ? ['left' as const] : []),
  ...(enabled.value.right ? ['right' as const] : []),
])

const labelsStrategy = computed<Strategy>(() => {
  if (strategy.value === 'cell') return { type: 'cell', size: 1 }
  if (strategy.value === 'interval') return { type: 'interval', placement: 'middle', fit: true }
  return strategy.value
})

const chart = computed(() => {
  const x = defaultXLabels()
  const y = defaultYLabels()
  x.labelOffset = labelOffset.value
  y.labelOffset = labelOffset.value
  x.padding = { clip: 2, flow: 2 }
  y.padding = { clip: 2, flow: 2 }
  x.strategy = labelsStrategy.value
  y.strategy = labelsStrategy.value

  return markRaw(new LabelsChart({
    layoutVariant: layoutVariant.value,
    axes: { top: 'space', right: 'space', bottom: 'space', left: 'space' },
    x,
    y,
    xSlots: xSlots.value,
    ySlots: ySlots.value,
    clipPlot: clipPlot.value,
    minLayoutSize: 0,
    onRender,
  }))
})

watchEffect(() => {
  chart.value.setPoints(points)
  chart.value.setRenderBounds({ minX: minX.value, maxX: maxX.value })
})

function setAll(value: boolean) {
  for (const side of sideList) enabled.value[side.value] = value
}
</script>
