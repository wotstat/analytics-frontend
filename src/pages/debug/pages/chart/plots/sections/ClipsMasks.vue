<template>
  <DebugSection title="defs: клипы и маски" id="clips"
    description="Пунктиром обведена область построения. Линия нарочно шире видимых bounds и лезет в поля: включай клип и смотри, по какому прямоугольнику её режет. Маска делает то же самое, но прозрачностью и с дырками."
    source="src/shared/uiKit/chart/universalChart/defs/ChartClip.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">clip target</span>
        <select v-model="clipTarget">
          <option v-for="item in targets" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">clip padding</span>
        <input type="range" min="-20" max="40" step="1" v-model.number="clipPadding">
        <span class="debug-value">{{ clipPadding }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">layoutVariant</span>
        <select v-model="layoutVariant">
          <option value="horizontal">horizontal</option>
          <option value="vertical">vertical</option>
          <option value="square">square</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">маска</span>
        <input type="checkbox" v-model="withMask">
      </label>

      <label class="debug-control" v-if="withMask">
        <span class="debug-label">mask padding</span>
        <input type="range" min="-10" max="60" step="1" v-model.number="maskPadding">
        <span class="debug-value">{{ maskPadding }}px</span>
      </label>

      <label class="debug-control" v-if="withMask">
        <span class="debug-label">fillTarget</span>
        <input type="checkbox" v-model="fillTarget">
      </label>

      <label class="debug-control">
        <span class="debug-label">поля (minLayoutSize)</span>
        <input type="range" min="0" max="80" step="1" v-model.number="margin">
        <span class="debug-value">{{ margin }}px</span>
      </label>
    </div>

    <ChartStage :chart="instance.chart" :height="280" />

    <p class="debug-note">
      <b>target — это слот, а не «сторона прямоугольника».</b> center берёт область построения, остальные —
      прямоугольник соответствующего слота из <span class="debug-value">getSlotRect</span>. Если слот не зарезервирован
      (поля в нуле и никаких addSlot), у него нулевой размер: клип по такому слоту прячет содержимое целиком.
      Крути «поля» в ноль при clip target = left — линия исчезнет.
    </p>

    <p class="debug-note">
      <b>Форма слота зависит от layoutVariant.</b> При horizontal слоты left/right занимают только высоту области
      построения, при vertical — всю высоту графика, а top/bottom наоборот. Переключай варианты с clip target = left:
      прямоугольник клипа заметно меняется, хотя ни данные, ни поля не тронуты.
    </p>

    <p class="debug-note">
      <b>Отрицательный padding расширяет.</b> Именно так в боевом коде дают линии выйти на пиксель за верх и низ
      (<span class="debug-value">{ top: -1, bottom: -1 }</span>), чтобы жирная линия на границе не выглядела
      обрезанной. Положительный padding, наоборот, вгрызается внутрь.
    </p>

    <p class="debug-note">
      <b>Маска — это белый прямоугольник по тому же слоту.</b> Белое видно, чёрное прозрачно, поэтому чёрные дети
      маски прорезают дырки (так работают маркеры с maskSize, см. секцию AutoMarkers). Флаг
      <span class="debug-value">fillTarget = false</span> отключает создание белого прямоугольника: маска остаётся
      пустой, и содержимое исчезает полностью — сними галку и убедись.
    </p>

    <p class="debug-note">
      Клип и маска пересчитывают свой прямоугольник в <span class="debug-value">didLayout</span>, то есть только
      когда layout действительно изменился. Смена одних bounds прямоугольник не двигает — и не должна: он привязан к
      пикселям области, а не к данным.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { RectangleArea } from '@/shared/uiKit/chart/universalChart/plot/area/RectangleArea'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import { useChartInstance } from '../shared/useChartInstance'

const targets = ['none', 'center', 'left', 'right', 'top', 'bottom'] as const

const series = syntheticSeries('smooth', 2, 100)

const clipTarget = ref<typeof targets[number]>('none')
const clipPadding = ref(0)
const layoutVariant = ref<'horizontal' | 'vertical' | 'square'>('horizontal')
const withMask = ref(false)
const maskPadding = ref(0)
const fillTarget = ref(true)
const margin = ref(40)

const { instance, rebuild } = useChartInstance(build)

function build() {
  const clip = clipTarget.value === 'none' ? null : new ChartClip(clipTarget.value, clipPadding.value)
  const mask = withMask.value ? new ChartMask('center', maskPadding.value, fillTarget.value) : null

  const line = new AutoLine({
    classes: ['main-line', 'solid-area', 'series-a'],
    area: true,
    smoothingMethod: 'monotone',
  })

  const group = new PlotGroup().addPlot(line)
  if (clip) group.clipBy(clip)
  if (mask) group.maskBy(mask)

  // Рамка области построения: ±Infinity с layoutLimited даёт ровно прямоугольник layout.
  const frame = new RectangleArea('layout-frame', { layoutLimited: true })
  frame.setPoints({ x: -Infinity, y: -Infinity }, { x: Infinity, y: Infinity })

  const chart = new UniversalChart({
    layoutVariant: layoutVariant.value,
    renderManager: globalChartRenderManagerSteps4,
  })
    .addPlot(group, 'plot')
    .addPlot(frame, 'plot')

  if (clip) chart.addDefs(clip)
  if (mask) chart.addDefs(mask)

  line.setPoints(series)

  chart.setRenderBounds({ minX: 20, maxX: 70 })

  return { chart, line }
}

watch([clipTarget, clipPadding, layoutVariant, withMask, maskPadding, fillTarget], () => rebuild())

watchEffect(() => instance.value.chart.setMinLayoutSize(margin.value))

</script>


<style scoped lang="scss">
:deep(.universal-chart-root) {
  .layout-frame rect {
    fill: none;
    stroke: #ffffff40;
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
}
</style>
