<template>
  <DebugSection title="Тултип и несколько линий" id="tooltip-lines"
    description="Три совместимые линии объединяются до запроса: lineA.interaction.union(lineB.interaction).union(lineC.interaction), дальше один nearestByAxis('x') с global-axis-bucket. Вертикальная линия, маркеры и ChartTooltip читают одну и ту же композицию, поэтому обязаны стоять на одном X."
    source="src/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">данные</span>
        <select v-model="preset">
          <option v-for="item in seriesPresets" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">tooltipPivot</span>
        <select v-model="tooltipPivot">
          <option value="cursor">cursor</option>
          <option value="nearest">nearest</option>
          <option value="avg">avg</option>
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
        <span class="debug-label">маркеры</span>
        <input type="checkbox" v-model="marker">
      </label>

      <label class="debug-control">
        <span class="debug-label">тултип</span>
        <input type="checkbox" v-model="tooltip">
      </label>

      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    </div>

    <DemoChartView :chart="chart" :height="300" />

    <TooltipCard :ctx="ctx" v-if="ctx" />

    <table class="debug-table">
      <tbody>
        <tr>
          <th>onShow / onPositionChange / onHide</th>
          <td>{{ shows }} / {{ updates }} / {{ hides }}</td>
        </tr>
        <tr>
          <th>ctx.hits</th>
          <td>{{ ctx ? ctx.hits.map(hitLabel).join(', ') : 'нет контекста' }}</td>
        </tr>
        <tr>
          <th>pivot / absolutePivot</th>
          <td v-if="ctx">
            {{ ctx.pivot.x.toFixed(0) }}, {{ ctx.pivot.y.toFixed(0) }} ·
            {{ ctx.absolutePivot.x.toFixed(0) }}, {{ ctx.absolutePivot.y.toFixed(0) }}
          </td>
          <td v-else>—</td>
        </tr>
        <tr>
          <th>cursor / absoluteCursor</th>
          <td v-if="ctx">
            {{ ctx.cursor.clientX.toFixed(0) }}, {{ ctx.cursor.clientY.toFixed(0) }} ·
            {{ ctx.absoluteCursor.x.toFixed(0) }}, {{ ctx.absoluteCursor.y.toFixed(0) }}
          </td>
          <td v-else>—</td>
        </tr>
        <tr>
          <th>chartBox / absoluteChartBox</th>
          <td v-if="ctx">
            {{ boxLabel(ctx.chartBox) }} · {{ boxLabel(ctx.absoluteChartBox) }}
          </td>
          <td v-else>—</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Union совместимых sources происходит <b>до</b> запроса, поэтому bucket общий: сначала выбирается ближайшее
      значение X среди исходных точек всех трёх линий, затем возвращаются все точки, у которых X
      <b>ровно</b> такой же. На разных сетках X это видно сразу — победившее значение принадлежит одной линии, и
      остальные в тултип не попадают, потому что своей точки в этом X у них нет.
    </p>

    <p class="debug-note">
      Пресет <span class="debug-value">null в победившем X</span> закрывает соседний случай: линия B существует, но в
      выигравшем X у неё разрыв. Соседнюю точку она не подставляет — строки в тултипе просто нет.
      Пресет <span class="debug-value">совпадающие координаты</span> показывает обратное: у A и B одинаковые
      координаты, поэтому вертикальная линия одна и маркер один (set semantics по уникальной геометрии), а строк в
      тултипе две — <span class="debug-value">ctx.hits</span> дедуплицируется только по semantic identity, а у разных
      линий она разная.
    </p>

    <p class="debug-note">
      <span class="debug-value">tooltipPivot</span> меняет только позиционирование карточки и не трогает порядок и
      состав <span class="debug-value">hits</span>: <span class="debug-value">cursor</span> — точка ввода,
      <span class="debug-value">nearest</span> — anchor хита с минимальным общим distance,
      <span class="debug-value">avg</span> — среднее всех anchors. Карточка стенда позиционируется по
      <span class="debug-value">ctx.pivot</span> в клиентских координатах;
      <span class="debug-value">absolutePivot</span> — тот же pivot плюс снимок скролла окна, снятый до layout.
    </p>

    <p class="debug-note">
      Счётчики сверху — контракт колбэков: <span class="debug-value">onShow</span> только на переходе пусто → непусто,
      <span class="debug-value">onPositionChange</span> на каждом опубликованном кадре,
      <span class="debug-value">onHide</span> на обратном переходе, при уводе курсора и при
      <span class="debug-value">updateOptions</span>. Поэтому переключение любого тумблера выше добавляет по одному
      скрытию: полная замена опций закрывает старый активный контекст.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, shallowRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { TooltipBox, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import DemoChartView from '../shared/DemoChartView.vue'
import TooltipCard from '../shared/TooltipCard.vue'
import { ComposedHit, MultiLineChart } from '../shared/MultiLineChart'
import { SeriesPreset, seriesPresets } from '../shared/tooltipSeries'

const preset = ref<SeriesPreset>('aligned')
const tooltipPivot = ref<'cursor' | 'nearest' | 'avg'>('cursor')
const limited = ref(false)
const maxAxisDistance = ref(30)
const verticalLine = ref(true)
const marker = ref(true)
const tooltip = ref(true)

const ctx = shallowRef<TooltipCtx<ComposedHit> | null>(null)
const shows = ref(0)
const updates = ref(0)
const hides = ref(0)

const chart = markRaw(new MultiLineChart({ zoom: true }))

const stopTooltip = chart.onTooltip.on(next => {
  ctx.value = next
  if (next) updates.value++
})

const stopEvents = chart.onTooltipEvent.on(event => event === 'show' ? shows.value++ : hides.value++)

watchEffect(() => chart.setConfig({
  preset: preset.value,
  tooltipPivot: tooltipPivot.value,
  maxAxisDistance: limited.value ? maxAxisDistance.value : null,
  verticalLine: verticalLine.value,
  marker: marker.value,
  tooltip: tooltip.value,
}))

onUnmounted(() => {
  stopTooltip()
  stopEvents()
})

function hitLabel(hit: ComposedHit) {
  return hit.kind === 'cursor' ? 'курсор' : `${hit.datum.label} (#${hit.pointIndex}, ${hit.distance.toFixed(0)}px)`
}

function boxLabel(box: TooltipBox) {
  return `${box.left.toFixed(0)}…${box.right.toFixed(0)} × ${box.top.toFixed(0)}…${box.bottom.toFixed(0)}`
}

</script>
