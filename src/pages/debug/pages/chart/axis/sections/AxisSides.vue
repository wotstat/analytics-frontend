<template>
  <DebugSection title="Рамка области и оси по значению" id="axis-sides"
    description="Это две разные сущности. PlotAreaBorder рисует рамку области построения — отделяет её от слотов с подписями; каждая сторона включается отдельно: space — по границе области, full — через весь SVG. ChartAxis рисует линию по значению данных и живёт только внутри области."
    source="src/shared/uiKit/chart/universalChart/axis/">

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
      Все четыре стороны в режиме <b>space</b> дают замкнутый прямоугольник:
      <span class="debug-value">PlotAreaBorder</span> склеивает соприкасающиеся отрезки в один path и закрывает его
      через <span class="debug-value">Z</span>. Разные варианты у соседних сторон линии уже не склеят — будет два path.
    </p>

    <p class="debug-note">
      <b>Рамка и ось — разные вещи, и их легко перепутать.</b> Рамка привязана к геометрии: её стороны идут по краям
      области построения, а <span class="debug-value">full</span> тянет линию через весь SVG. Ось привязана к данным:
      <span class="debug-value">new ChartAxis('vertical', 0, 'zero-line')</span> — это галочка «линия нуля».
      <span class="debug-value">axis</span> называет ось, на которой отложено значение, как у тиков и подписей:
      <span class="debug-value">'vertical'</span> — значение по Y, линия горизонтальная. Варианта
      <span class="debug-value">full</span> у неё нет и быть не может — линия по координате осмысленна только внутри
      области, за её границами не рисуется вовсе. Возьми данные «С отрицательными» и сравни: нижняя сторона рамки
      останется у края, а нулевая линия встанет на y=0.
    </p>

    <p class="debug-note">
      Сторона слота передаётся в <span class="debug-value">BaseLabels</span> и определяет обе части геометрии:
      где чарт резервирует место и от какой границы области renderer откладывает
      <span class="debug-value">labelOffset</span>. Включи «подписи X в слот top» — подписи вместе со своим местом
      переедут наверх.
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
import { LabelsChart, type BorderVariant, type LayoutVariant } from '../shared/LabelsChart'
import { useProbe } from '../shared/probe'
import { defaultXLabels, defaultYLabels } from '../shared/options'

const sideList = [
  { value: 'top', label: 'top' },
  { value: 'right', label: 'right' },
  { value: 'bottom', label: 'bottom' },
  { value: 'left', label: 'left' },
] as const

const kinds = seriesKinds.filter(item => item.value !== 'huge')

const sides = ref<Record<typeof sideList[number]['value'], BorderVariant | ''>>({
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
  const result: Partial<Record<typeof sideList[number]['value'], BorderVariant>> = {}
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

function setAll(value: BorderVariant | '') {
  for (const side of sideList) sides.value[side.value] = value
}
</script>
