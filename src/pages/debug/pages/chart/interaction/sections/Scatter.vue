<template>
  <DebugSection title="Scatter: nearestPoint по visual radius" id="scatter"
    description="scatter.interaction.nearestPoint({ maxDistance }) ранжирует по расстоянию до центра маркера. Eligibility — contains || distance ≤ maxDistance, поэтому крупная марка не имеет мёртвого края, даже если её visual radius больше maxDistance. contains считается по данным (markers[i].size), не по атрибуту r в DOM."
    source="src/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkersInteractionSource.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">maxDistance, px</span>
        <input type="number" v-model.number="maxDistance" min="0" max="60" step="1">
      </label>

      <label class="debug-control">
        <span class="debug-label">увеличенный size (тот же count)</span>
        <input type="checkbox" v-model="bigSize">
      </label>

      <label class="debug-control">
        <span class="debug-label">Highlight</span>
        <input type="checkbox" v-model="highlight">
      </label>

      <label class="debug-control">
        <span class="debug-label">VerticalLine</span>
        <input type="checkbox" v-model="verticalLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">HorizontalLine</span>
        <input type="checkbox" v-model="horizontalLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">ChartTooltip</span>
        <input type="checkbox" v-model="tooltip">
      </label>

      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    </div>

    <div ref="stage">
      <DemoChartView :chart="chart" :height="300" />
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>маркер</th>
          <th>x, y</th>
          <th>size (данные)</th>
          <th>DOM r (target)</th>
          <th>DOM r (mask)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in reference" :key="row.index">
          <td>{{ row.label }}</td>
          <td>{{ row.x }}, {{ row.y }}</td>
          <td>{{ row.size }}</td>
          <td :class="row.r === row.size ? 'ok' : 'bad'">{{ row.r }}</td>
          <td>{{ row.maskR }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <b>Проверка бага переиспользования маркеров.</b> Колонка «DOM r (target)» обязана совпадать с «size (данные)» в любой момент,
      в том числе сразу после переключения <span class="debug-value">увеличенный size</span>: количество маркеров не
      меняется, <span class="debug-value">BaseMarkers</span> переиспользует те же инстансы, и без починки
      <span class="debug-value">AutoMarker.render()</span> радиус в DOM отставал бы от нового
      <span class="debug-value">size</span>. «DOM r (mask)» синхронно едет тем же переключателем.
    </p>

    <table class="debug-table">
      <thead>
        <tr>
          <th>nearestPoint()</th>
          <th>distance, px</th>
          <th>contains</th>
          <th>targets</th>
          <th>datum — точная исходная ссылка</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in hitRows" :key="row.index">
          <td>{{ row.datum.label }}</td>
          <td>{{ fmt(row.distance) }}</td>
          <td>{{ row.contains ? 'да' : 'нет' }}</td>
          <td>{{ row.targets }}</td>
          <td :class="row.identityOk ? 'ok' : 'bad'">{{ row.identityOk ? 'да, === ' : 'НЕТ' }}</td>
        </tr>
        <tr v-if="hitRows.length === 0">
          <td colspan="5" class="empty">selection пуст — курсор вне maxDistance от всех маркеров</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <b>A — внутри visual radius.</b> Наведи курсор точно в центр первого маркера: <span class="debug-value">contains</span>
      «да» при любом <span class="debug-value">maxDistance</span>, включая 0.
    </p>

    <p class="debug-note">
      <b>B — вне радиуса, внутри maxDistance.</b> У второго маркера небольшой <span class="debug-value">size</span>.
      Наведи курсор рядом, но не точно в центр: строка появляется с <span class="debug-value">contains: нет</span>,
      пока <span class="debug-value">distance ≤ maxDistance</span> — это и есть eligibility
      <span class="debug-value">contains || distance ≤ maxDistance</span>, а не одно только попадание в круг.
    </p>

    <p class="debug-note">
      <b>C — visual radius больше maxDistance.</b> Третий маркер крупный (size 26, ×2 во «увеличенном» режиме).
      Поставь <span class="debug-value">maxDistance</span> меньше его size и наведи курсор у самого края круга,
      дальше от центра, чем maxDistance, но всё ещё внутри видимой заливки: hit остаётся —
      <span class="debug-value">contains</span> у крупной марки не имеет мёртвого края.
    </p>

    <p class="debug-note">
      <b>D/E — точное перекрытие.</b> Четвёртый и пятый маркеры стоят в одной точке. При наведении ровно в центр
      побеждает <b>E</b> — он позже по порядку source, а `nearestHit` при точном равенстве distance берёт
      последнего кандидата в переборе.
    </p>

    <p class="debug-note">
      <b>Exact original datum reference.</b> Колонка «datum — точная исходная ссылка» сравнивает
      <span class="debug-value">hit.datum === chart.points[hit.markerIndex]</span>. <span class="debug-value">label</span>
      в hit'е — не часть стилевых опций маркера, поэтому его наличие само по себе уже доказывает, что datum не
      нормализованная spread-копия, а <span class="debug-value">AutoMarkers</span> хранит exact original reference
      рядом с резолвленными для рендера default.
    </p>

    <div class="debug-row current">
      <span class="debug-label">onShow / onPositionChange / onHide</span>
      <span class="debug-value count">{{ shows }} / {{ updates }} / {{ hides }}</span>
    </div>

    <div class="debug-row current" v-if="tooltipCtx">
      <span class="debug-label">ctx.isHighlighted(hit, highlight)</span>
      <span class="debug-value" :class="isHighlightedOk ? 'ok' : 'bad'">{{ isHighlightedOk ? 'да' : 'нет' }}</span>
      <span class="debug-hint">— тот же selection одновременно кормит Highlight и ChartTooltip</span>
    </div>

    <p class="debug-note">
      Одна и та же <span class="debug-value">selection</span> из <span class="debug-value">nearestPoint()</span>
      передана в <span class="debug-value">Highlight</span>, <span class="debug-value">ChartTooltip</span>,
      <span class="debug-value">VerticalLine</span> и <span class="debug-value">HorizontalLine</span> без изменений.
      Выключай каждый компонент чекбоксом выше по отдельности — состав и позиция найденного маркера не меняются,
      меняется только то, что из этого реально нарисовано.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { useMutationObserver } from '@vueuse/core'
import { computed, markRaw, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import DemoChartView from '../shared/DemoChartView.vue'
import { fmt } from '../shared/format'
import { defaultScatterConfig, ScatterChart, ScatterHit } from '../shared/ScatterChart'

const defaults = defaultScatterConfig()

const maxDistance = ref(defaults.maxDistance)
const bigSize = ref(defaults.bigSize)
const highlight = ref(defaults.highlight)
const verticalLine = ref(defaults.verticalLine)
const horizontalLine = ref(defaults.horizontalLine)
const tooltip = ref(defaults.tooltip)

const hits = shallowRef<readonly ScatterHit[]>([])
const tooltipCtx = shallowRef<TooltipCtx<ScatterHit> | null>(null)
const shows = ref(0)
const updates = ref(0)
const hides = ref(0)

type ReferenceRow = { index: number, label: string, x: number, y: number, size: number, r: number | null, maskR: number | null }
const reference = ref<ReferenceRow[]>([])

const stage = useTemplateRef<HTMLElement>('stage')

const chart = markRaw(new ScatterChart())

const stopHit = chart.onHit.on(next => hits.value = next)
const stopTooltip = chart.onTooltip.on(ctx => {
  const wasActive = tooltipCtx.value !== null
  tooltipCtx.value = ctx
  if (ctx && !wasActive) shows.value++
  if (ctx) updates.value++
  if (!ctx && wasActive) hides.value++
})
const stopAfterRender = chart.onAfterRender.on(refreshReference)

watchEffect(() => chart.setConfig({
  maxDistance: maxDistance.value,
  bigSize: bigSize.value,
  highlight: highlight.value,
  verticalLine: verticalLine.value,
  horizontalLine: horizontalLine.value,
  tooltip: tooltip.value,
}))

// r/mask r обновляются в render-фазе интерактивного кадра, а не только по setMarkers — наблюдатель
// нужен на случай изменения без afterRender (например повторный setConfig с теми же ключами)
useMutationObserver(stage, refreshReference, { attributes: true, attributeFilter: ['r'], subtree: true })
onMounted(refreshReference)

onUnmounted(() => {
  stopHit()
  stopTooltip()
  stopAfterRender()
})

const hitRows = computed(() => hits.value.map(hit => ({
  index: hit.markerIndex,
  datum: hit.datum,
  distance: hit.distance,
  contains: hit.contains,
  targets: hit.targets.length,
  identityOk: hit.datum === chart.points[hit.markerIndex],
})))

const isHighlightedOk = computed(() => {
  const ctx = tooltipCtx.value
  const hit = hits.value[0]
  if (!ctx || !hit) return false
  return ctx.isHighlighted(hit, chart.highlight)
})

function refreshReference() {
  reference.value = chart.points.map((point, index) => {
    const dom = chart.markerDomRadius(index)
    return { index, label: point.label, x: point.x, y: point.y, size: point.size ?? 0, r: dom.r, maskR: dom.maskR }
  })
}

</script>


<style scoped lang="scss">
@use '../shared/statusStyles.scss' as *;
</style>
