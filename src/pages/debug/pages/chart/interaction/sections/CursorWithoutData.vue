<template>
  <DebugSection title="Курсор без данных" id="cursor-without-data"
    description="Тот же контроллер и те же две линии, но в чарте нет ни одного плота: область задана вручную через setRenderBounds. cursorSelection() не зависит от данных, поэтому линии обязаны работать ровно так же."
    source="src/shared/uiKit/chart/universalChart/interaction/core/cursorSelection.ts">

    <DemoChartView :chart="chart" :height="200" />

    <p class="debug-note">
      Это граница ответственности: курсорный hit не знает ни про плоты, ни про
      <span class="debug-value">ChartSpace.bounds</span> — у него
      <span class="debug-value">anchor</span> в точке указателя, <span class="debug-value">contains: false</span> и
      <span class="debug-value">distance: Infinity</span>. Бесконечность здесь намеренная: с нулём курсор выигрывал бы
      любой будущий <span class="debug-value">nearest()</span>, куда попал бы через union.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import DemoChartView from '../shared/DemoChartView.vue'
import { CursorChart } from '../shared/CursorChart'

const chart = markRaw(new CursorChart({ seriesCount: 0, cursor: { horizontalLine: true }, zoom: { zoom: false, panDirection: false } }))
chart.setRenderBounds({ minX: 0, maxX: 100, minY: 0, maxY: 100 })

</script>
