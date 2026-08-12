<template>
  <DebugSection title="Линия цепляется к точкам" id="line-points"
    description="line.interaction.nearestByAxis() ищет по исходным точкам плота: сначала выбирается ближайшее значение оси, затем возвращаются все точки ровно с этим значением. Вертикальная линия и маркер рисуют один и тот же selection, поэтому обязаны стоять на одной точке."
    source="src/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">ось</span>
        <select v-model="axis">
          <option value="x">x</option>
          <option value="y">y</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">maxAxisDistance</span>
        <input type="checkbox" v-model="limited">
      </label>

      <label class="debug-control">
        <span class="debug-label">px</span>
        <input type="number" v-model.number="maxAxisDistance" min="0" max="200" step="5" :disabled="!limited">
      </label>

      <label class="debug-control">
        <span class="debug-label">вертикальная линия</span>
        <input type="checkbox" v-model="verticalLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">горизонтальная линия</span>
        <input type="checkbox" v-model="horizontalLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">маркер</span>
        <input type="checkbox" v-model="marker">
      </label>

      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    </div>

    <DemoChartView :chart="chart" :height="280" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>pointIndex</th>
          <th>datum.x</th>
          <th>datum.y</th>
          <th>datum.label</th>
          <th>datum.flagged</th>
          <th>distance, px</th>
          <th>contains</th>
          <th>targets</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="hit in hits" :key="hit.pointIndex">
          <td>{{ hit.pointIndex }}</td>
          <td>{{ hit.datum.x }}</td>
          <td>{{ hit.datum.y.toFixed(1) }}</td>
          <td>{{ hit.datum.label }}</td>
          <td>{{ hit.datum.flagged ? 'да' : 'нет' }}</td>
          <td>{{ hit.distance.toFixed(1) }}</td>
          <td>{{ hit.contains ? 'да' : 'нет' }}</td>
          <td>{{ hit.targets.length }}</td>
        </tr>
        <tr v-if="hits.length === 0">
          <td colspan="8" class="empty">selection пуст</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <span class="debug-value">datum</span> — это исходный объект точки целиком, а не копия
      <span class="debug-value">{{ '{ x, y }' }}</span> рендерера: <span class="debug-value">AutoLine</span> стал
      generic и хранит те же ссылки, которые пришли в <span class="debug-value">setPoints</span>. Поля
      <span class="debug-value">label</span> и <span class="debug-value">flagged</span> плоту не нужны и доезжают до
      hit нетронутыми — маркер по <span class="debug-value">flagged</span> красится в оранжевый через
      <span class="debug-value">classesForHit</span>.
    </p>

    <p class="debug-note">
      <span class="debug-value">distance</span> в таблице — двумерное расстояние от курсора до точки, а не
      расстояние по оси. Ось участвует только в выборе bucket внутри запроса: снаружи её уже не восстановить,
      поэтому <span class="debug-value">maxAxisDistance</span> живёт в опциях запроса, а не в общем фильтре по
      расстоянию. Включи ограничение и уводи курсор вверх — точка останется выбранной, потому что по X она рядом;
      уводи вбок между точками — при малом пороге selection опустеет целиком.
    </p>

    <p class="debug-note">
      <span class="debug-value">targets</span> всегда 0: у исходной точки нет собственного SVG-элемента внутри
      <span class="debug-value">AutoLine</span>. Рисует её отдельный <span class="debug-value">MarkerOverlay</span>,
      который сам ничего не ищет — он получает готовые hits и ставит по одному маркеру на уникальную координату.
      Маркер ещё и пробивает дырку в линии через <span class="debug-value">targetMasks</span> и
      <span class="debug-value">maskSize</span>.
    </p>

    <p class="debug-note">
      Ось <span class="debug-value">y</span> переключает поиск на вертикальную метрику: удобнее смотреть вместе с
      горизонтальной линией. Порядок хитов — порядок точек в исходном массиве, сортировки по расстоянию здесь нет.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, shallowRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import DemoChartView from '../shared/DemoChartView.vue'
import { LinePointsChart, type LinePointsHit } from '../shared/LinePointsChart'
import { wavePoints } from '../shared/linePoints'

const axis = ref<'x' | 'y'>('x')
const limited = ref(false)
const maxAxisDistance = ref(30)
const verticalLine = ref(true)
const horizontalLine = ref(false)
const marker = ref(true)

const hits = shallowRef<readonly LinePointsHit[]>([])

const chart = markRaw(new LinePointsChart({ points: wavePoints(), zoom: true }))

const stopHits = chart.onHits.on(next => hits.value = next)

watchEffect(() => chart.setConfig({
  axis: axis.value,
  maxAxisDistance: limited.value ? maxAxisDistance.value : null,
  verticalLine: verticalLine.value,
  horizontalLine: horizontalLine.value,
  marker: marker.value,
}))

onUnmounted(stopHits)

</script>


<style scoped lang="scss">
@use '../shared/statusStyles.scss' as *;
</style>
