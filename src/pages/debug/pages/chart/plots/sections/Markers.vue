<template>
  <DebugSection title="AutoMarkers: точки на линии" id="auto-markers"
    description="Маркеры — это отдельный DOM-узел на каждую точку, никакой децимации у них нет. Меняй размер и смотри на порядок: у уже созданных маркеров он не поменяется, пока их не станет больше или меньше."
    source="src/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers.ts">

    <SeriesControls :state="data" hide-source />

    <div class="debug-row">
      <span class="debug-hint">точек одним кликом:</span>
      <button class="debug-btn" v-for="preset in presets" :key="preset" :class="{ active: data.count.value === preset }"
        @click="data.count.value = preset">
        {{ preset }}
      </button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">size</span>
        <input type="range" min="1" max="14" step="1" v-model.number="size">
        <span class="debug-value">{{ size }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">maskSize</span>
        <input type="range" min="0" max="24" step="1" v-model.number="maskSize">
        <span class="debug-value">{{ maskSize }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">variant</span>
        <select v-model="variant">
          <option value="circle">circle</option>
          <option value="square">square</option>
          <option value="diamond">diamond</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">цвет</span>
        <select v-model="color">
          <option v-for="item in colors" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <button class="debug-btn" @click="rebuild">пересоздать график</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">линия под маркерами</span>
        <input type="checkbox" v-model="withLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">маска (дырки под маркерами)</span>
        <input type="checkbox" v-model="withMask">
      </label>

      <label class="debug-control">
        <span class="debug-label">renderBounds вручную</span>
        <input type="checkbox" v-model="manualBounds">
      </label>
    </div>

    <ChartStage :chart="instance.chart" :height="260" />

    <p class="debug-note">
      <b>size и maskSize применяются только при создании маркера.</b> Радиус пишется в атрибут круга один раз, а
      последующие setMarkers двигают уже созданные круги и создают недостающие. Поэтому: подвигай size — ничего не
      произойдёт; теперь измени количество точек на единицу — новые маркеры появятся уже с новым размером, старые
      останутся с прежним, и на графике будут точки двух размеров одновременно. Кнопка «пересоздать график»
      приводит всё к одному виду. То же касается markerClasses и цвета.
    </p>

    <p class="debug-note">
      <b>variant не работает.</b> Опция есть в типах (circle / square / diamond), проходит в данные маркера и
      никуда дальше не идёт: AutoMarker всегда создаёт <span class="debug-value">circle</span>. Переключай — форма
      не изменится.
    </p>

    <p class="debug-note">
      <b>Маркеры не участвуют в bounds.</b> getBounds у них нет вообще, поэтому маркеры без линии дают пустые
      bounds, все координаты превращаются в NaN и график остаётся чистым. Сними «линию» — увидишь пустоту, включи
      «renderBounds вручную» — маркеры вернутся.
    </p>

    <p class="debug-note">
      <b>maskSize больше size</b> добавляет в подключённые маски по чёрному кругу на маркер — так под точкой
      прорезается дырка в залитой области. Включи маску и увеличь maskSize: вокруг каждой точки появится
      прозрачный ореол. Если maskSize ≤ size, в маску не пишется ничего.
    </p>

    <p class="debug-note">
      На 5–20 тысячах точек хорошо видно цену подхода: маркеров столько же, сколько точек, каждый — узел в SVG
      (а с маской — два), и страница ощутимо задумывается. Линия рядом на тех же данных остаётся дешёвой.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import type { ChartPoint } from '@/pages/debug/shared/fixtures/types'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { AutoMarkers } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import ChartStage from '../shared/ChartStage.vue'
import SeriesControls from '../shared/SeriesControls.vue'
import { useChartInstance } from '../shared/useChartInstance'
import { useSeriesSource } from '../shared/useSeriesSource'

const presets = [20, 120, 1000, 5000, 20000]
const colors = ['series-a', 'series-b', 'series-c', 'series-d'] as const

const data = useSeriesSource('noisy', 40)

const size = ref(4)
const maskSize = ref(7)
const variant = ref<'circle' | 'square' | 'diamond'>('circle')
const color = ref<typeof colors[number]>('series-a')
const withLine = ref(true)
const withMask = ref(true)
const manualBounds = ref(false)

const points = computed(() => data.series.value.filter((point): point is ChartPoint => point !== null))

const { instance, rebuild } = useChartInstance(build)

function build() {
  const mask = new ChartMask('center', { top: -1, bottom: -1 })

  const line = new AutoLine({
    classes: ['main-line', 'solid-area', color.value],
    area: true,
    smoothingMethod: 'monotone',
  })

  const markers = new AutoMarkers({
    classes: ['markers', color.value],
    targetMasks: withMask.value ? [mask.root] : [],
    size: size.value,
    maskSize: maskSize.value,
    variant: variant.value,
  })

  const group = new PlotGroup()
  if (withLine.value) group.addPlot(line)
  if (withMask.value) group.maskBy(mask)

  const chart = new UniversalChart({
    renderManager: globalChartRenderManagerSteps4,
    renderBoundsPadding: { vertical: 20 },
    minLayoutSize: 8,
  })
    .addPlot(group, 'plot')
    .addPlot(markers, 'plot')
    .addDefs(mask)

  return { chart, line, markers }
}

watch([withLine, withMask, color, variant], () => rebuild())

watchEffect(() => {
  const { chart, line, markers } = instance.value

  line.setPoints(data.series.value)
  markers.setMarkers(points.value.map(point => ({ x: point.x, y: point.y, size: size.value, maskSize: maskSize.value })))

  chart.setRenderBounds(manualBounds.value ? manualRenderBounds() : undefined)
})

function manualRenderBounds() {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const point of points.value) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  if (minX > maxX) return { minX: 0, maxX: 1, minY: 0, maxY: 1 }
  return { minX, maxX, minY: minY - 20, maxY: maxY + 20 }
}

</script>


<style scoped lang="scss">
:deep(.universal-chart-root) {
  .markers circle {
    fill: currentColor;
  }
}
</style>
