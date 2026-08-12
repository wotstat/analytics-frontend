<template>
  <DebugSection title="Зум и пан под курсорными линиями" id="zoom-pan"
    description="ZoomChartComponent не завязан на interaction sources и selections, поэтому в этом рефакторинге не менялся. Здесь он стоит рядом с курсорными линиями — жест двигает область, линии обязаны оставаться под курсором и не отставать на кадр."
    source="src/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">panDirection</span>
        <select v-model="panDirection">
          <option v-for="item in panDirections" :key="String(item.value)" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">zoom</span>
        <input type="checkbox" v-model="zoom">
      </label>

      <label class="debug-control">
        <span class="debug-label">autoFitFollow</span>
        <select v-model="autoFitFollow">
          <option v-for="item in autoFitVariants" :key="String(item.value)" :value="item.value">{{ item.label }}
          </option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">лимиты по X</span>
        <input type="checkbox" v-model="limited">
      </label>

      <label class="debug-control">
        <span class="debug-label">elastic</span>
        <input type="checkbox" v-model="elastic" :disabled="!limited">
      </label>

      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    </div>

    <DemoChartView :chart="chart" :height="280" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>ось</th>
          <th>min</th>
          <th>max</th>
          <th>окно</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>X (renderBounds)</th>
          <td>{{ formatBound(bounds.minX) }}</td>
          <td>{{ formatBound(bounds.maxX) }}</td>
          <td>{{ formatBound(bounds.maxX - bounds.minX) }}</td>
        </tr>
        <tr>
          <th>Y (renderBounds)</th>
          <td>{{ formatBound(bounds.minY) }}</td>
          <td>{{ formatBound(bounds.maxY) }}</td>
          <td>{{ formatBound(bounds.maxY - bounds.minY) }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Что здесь ловится: контроллер добавлен в чарт последним, поэтому на его
      <span class="debug-value">render()</span> зум уже применил границы этого кадра. Веди мышь с зажатой кнопкой —
      линия обязана стоять ровно под курсором всё время пана. Если она дрожит или отстаёт, порядок компонентов или
      порядок плотов нарушен.
    </p>

    <p class="debug-note">
      Второе: смена данных плота не помечает контроллер грязным, поэтому
      <span class="debug-value">InteractionController</span> переопределяет
      <span class="debug-value">render()</span> и не наследует ранний выход по space-hash. Колесо и пан меняют
      <span class="debug-value">ChartSpace</span>, так что здесь ранний выход всё равно бы не сработал — цена этого
      решения видна как раз на неподвижном графике: кадры идут, но prepare-фаза выходит на первом же пустом resolve.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { InteractionDirection } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import DemoChartView from '../shared/DemoChartView.vue'
import { CursorChart, type ZoomConfig } from '../shared/CursorChart'
import { panDirections } from '../shared/panDirections'
import { seriesExtent } from '../shared/series'
import { formatBound, useChartBounds } from '../shared/useChartBounds'

const autoFitVariants = [
  { value: true, label: 'true (по умолчанию)' },
  { value: 6, label: '6 (вязко)' },
  { value: false, label: 'false (снап)' },
] as const

const panDirection = ref<InteractionDirection>('horizontal')
const zoom = ref(true)
const autoFitFollow = ref<boolean | number>(true)
const limited = ref(true)
const elastic = ref(true)

const series = [syntheticSeries('smooth', 7, 240)]
const extent = seriesExtent(series)

const chart = markRaw(new CursorChart({ cursor: { horizontalLine: true } }))
chart.setSeries(series)

const bounds = useChartBounds(chart)

const limits = computed<ZoomConfig['limits']>(() => {
  if (!limited.value) return undefined

  return {
    minX: extent.minX,
    maxX: extent.maxX,
    minDeltaX: Math.min(10, extent.maxX - extent.minX),
    maxDeltaX: extent.maxX - extent.minX,
    elastic: elastic.value,
  }
})

watchEffect(() => chart.setZoom({
  zoom: zoom.value,
  panDirection: panDirection.value,
  autoFitFollow: autoFitFollow.value,
  limits: limits.value,
}))

</script>
