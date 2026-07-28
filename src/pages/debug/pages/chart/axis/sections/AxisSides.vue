<template>
  <DebugSection title="Оси: стороны и варианты" id="axis-sides"
    description="Axis рисует линии по границам области данных. Каждая сторона включается отдельно: space — только по ширине/высоте области, full — через весь SVG, включая зоны подписей. Смотри, где линия обрывается на границе слота, а где идёт до края."
    source="src/shared/uiKit/chart/universalChart/axis/Axis.ts">

    <div class="debug-row">
      <label class="debug-control" v-for="side in sideList" :key="side.value">
        <span class="debug-label">{{ side.label }}</span>
        <select v-model="sides[side.value]">
          <option value="">нет</option>
          <option value="space">space</option>
          <option value="full">full</option>
        </select>
      </label>

      <button class="debug-btn" @click="setAll('space')">все space</button>
      <button class="debug-btn" @click="setAll('full')">все full</button>
      <button class="debug-btn" @click="setAll('')">убрать</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">данные</span>
        <select v-model="kind">
          <option v-for="item in kinds" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">layoutVariant</span>
        <select v-model="layoutVariant">
          <option value="vertical">vertical</option>
          <option value="horizontal">horizontal</option>
          <option value="square">square</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">линия нуля</span>
        <input type="checkbox" v-model="zeroLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">подписи X в слот top</span>
        <input type="checkbox" v-model="labelsOnTop">
      </label>

      <label class="debug-control">
        <span class="debug-label">высота</span>
        <input type="range" min="80" max="400" step="10" v-model.number="height">
        <span class="debug-value">{{ height }}px</span>
      </label>
    </div>

    <ChartStage :chart="chart" :height="height" />

    <ProbeReadout :state="state" axis="both" />

    <p class="debug-note">
      Все четыре стороны в режиме <b>space</b> дают замкнутый прямоугольник: Axis склеивает соприкасающиеся отрезки
      в один path и закрывает его через <span class="debug-value">Z</span>. Разные варианты у соседних сторон линии
      уже не склеят — будет два path.
    </p>

    <p class="debug-note">
      Ось всегда идёт по границе области данных, <b>по нулю Axis рисовать не умеет</b>. Возьми данные «С отрицательными»:
      линия снизу останется у нижнего края, а не у y=0. Галочка «линия нуля» показывает обходной путь —
      <span class="debug-value">TicksByValues('vertical')</span> с единственным тиком 0 на всю ширину области.
    </p>

    <p class="debug-note">
      Подписи умеют жить только снизу (горизонтальные) и слева (вертикальные):
      <span class="debug-value">BaseLabels</span> считает координату от
      <span class="debug-value">layout.y + layout.height</span> и <span class="debug-value">layout.x</span>. Включи
      «подписи X в слот top» — место сверху зарезервируется, а текст останется снизу и наложится на нижнюю ось.
    </p>

    <p class="debug-note">
      <b>layoutVariant</b> решает не только геометрию слотов, но и то, куда подписям разрешено вылезать:
      overflow считается только по одной паре сторон (<span class="debug-value">vertical</span> — сверху/снизу,
      <span class="debug-value">horizontal</span> — слева/справа), а у <span class="debug-value">square</span>
      overflow нулевой со всех сторон. В строке readout видно, как меняется overflow: от него зависит, разрешено ли
      крайней подписи заехать в соседний слот.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { seriesKinds, syntheticSeries, type SeriesKind } from '@/pages/debug/shared/fixtures/syntheticSeries'
import ChartStage from '../shared/ChartStage.vue'
import ProbeReadout from '../shared/ProbeReadout.vue'
import { LabelsChart, type AxisVariant, type LayoutVariant } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'
import { defaultXLabels, defaultYLabels } from '../shared/options'

const sideList = [
  { value: 'top', label: 'top' },
  { value: 'right', label: 'right' },
  { value: 'bottom', label: 'bottom' },
  { value: 'left', label: 'left' },
] as const

const kinds = seriesKinds.filter(item => item.value !== 'huge')

const sides = ref<Record<typeof sideList[number]['value'], AxisVariant | ''>>({
  top: '',
  right: '',
  bottom: 'space',
  left: 'space',
})

const kind = ref<SeriesKind>('negative')
const layoutVariant = ref<LayoutVariant>('vertical')
const zeroLine = ref(true)
const labelsOnTop = ref(false)
const height = ref(220)

const { state, onRender } = useProbe()

const points = computed(() => syntheticSeries(kind.value, 3, 60))

const axes = computed(() => {
  const result: Partial<Record<typeof sideList[number]['value'], AxisVariant>> = {}
  for (const side of sideList) {
    const value = sides.value[side.value]
    if (value) result[side.value] = value
  }
  return result
})

const chart = computed(() => markRaw(new LabelsChart({
  layoutVariant: layoutVariant.value,
  axes: axes.value,
  x: defaultXLabels(),
  y: defaultYLabels(),
  xSlot: labelsOnTop.value ? 'top' : 'bottom',
  ticks: { x: 'labels', y: 'labels' },
  zeroLine: zeroLine.value,
  onRender,
})))

watchEffect(() => chart.value.setPoints(points.value))

function setAll(value: AxisVariant | '') {
  for (const side of sideList) sides.value[side.value] = value
}
</script>
