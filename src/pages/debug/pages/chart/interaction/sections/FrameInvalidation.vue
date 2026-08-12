<template>
  <DebugSection title="Кадр, инвалидация и композиция selections" id="frame-invalidation"
    description="То, что не проявляется ни в одном сценарии выше: смена данных плота и removePlot() при неподвижном курсоре, и removeComponent() прямо из колбэка ChartTooltip во время render-фазы. Остальные сценарии кадра и композиции selections закрыты в других секциях — ссылки в примечании ниже."
    source="src/shared/uiKit/chart/universalChart/interaction/composable/InteractionController.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="changeData">Изменить данные (курсор не двигаем)</button>
      <button class="debug-btn" :disabled="!attached" @click="removePlot">removePlot() при активном ховере</button>
      <button class="debug-btn" :disabled="attached" @click="restorePlot">Вернуть plot обратно</button>
      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">тултип снимает MarkerOverlay из onShow</span>
        <input type="checkbox" v-model="removeMarkerOnShow">
      </label>

      <button class="debug-btn" @click="restoreMarker">Вернуть MarkerOverlay</button>
    </div>

    <DemoChartView :chart="chart" :height="260" />

    <div class="debug-row current">
      <span class="debug-label">plot прикреплён</span>
      <span class="debug-value" :class="attached ? 'ok' : 'bad'">{{ attached ? 'да' : 'нет' }}</span>

      <span class="debug-label">highlight в DOM</span>
      <span class="debug-value count">{{ counts.highlight }}</span>

      <span class="debug-label">маркеров в DOM</span>
      <span class="debug-value count">{{ counts.marker }}</span>

      <span class="debug-label">тултип активен</span>
      <span class="debug-value" :class="tooltipCtx ? 'ok' : 'muted'">{{ tooltipCtx ? 'да' : 'нет' }}</span>
    </div>

    <div class="debug-row current" v-if="tooltipCtx">
      <span class="debug-label">подсвеченное значение Y</span>
      <span class="debug-value count">{{ tooltipCtx.hits[0]?.datum.y.toFixed(1) ?? '—' }}</span>
    </div>

    <div class="debug-row current">
      <span class="debug-label">removeComponent() из колбэка тултипа вызван</span>
      <span class="debug-value count">{{ callbackRemoves }}</span>
    </div>

    <EventLog :entries="entries" title="onShow / onPositionChange / onHide" empty="Ховера ещё не было" @clear="clear" />

    <p class="debug-note">
      <b>Смена данных при неподвижном курсоре.</b> Наведи курсор на линию и, не двигая мышь, нажми
      «Изменить данные»: <span class="debug-value">line.setPoints()</span> планирует кадр чарта, контроллер не
      наследует space-hash short-circuit — highlight, маркер и «подсвеченное значение Y» выше обновляются в том же
      кадре, без единого движения указателя. Если бы контроллер унаследовал ранний выход
      <span class="debug-value">BasePlotRenderer.render()</span>, все три остались бы от старого набора данных.
    </p>

    <p class="debug-note">
      <b>removePlot() во время активного ховера.</b> Не уводя курсор, нажми «removePlot()»: линия — единственный
      источник bounds этого графика, поэтому <span class="debug-value">ChartSpace.bounds</span> схлопывается в
      пустой (<span class="debug-value">Bounds.contains()</span> лжив при <span class="debug-value">minX =
        Infinity</span>), и <span class="debug-value">nearestByAxis()</span> перестаёт находить точки сам по себе —
      никакого специального «detached plot» кейса в source нет. Highlight и MarkerOverlay снимаются, тултип получает
      <span class="debug-value">onHide()</span>. «Вернуть plot обратно» восстанавливает данные без движения курсора.
    </p>

    <p class="debug-note">
      <b>removeComponent() из колбэка во время render-фазы.</b> В <span class="debug-value">components</span>
      контроллера порядок — <span class="debug-value">[highlight, tooltip, marker]</span>: marker добавлен позже
      tooltip, поэтому к моменту, когда <span class="debug-value">onShow</span> тултипа (сам он выполняется внутри
      <span class="debug-value">renderInteraction</span>) вызывает <span class="debug-value">controller.
        removeComponent(marker)</span>, marker в этом кадре свой <span class="debug-value">renderInteraction</span>
      ещё не получил. Включи галку и наведи курсор — счётчик «removeComponent() из колбэка» увеличится, маркеры
      пропадут без ошибки в консоли: контроллер продолжает снимок компонентов этого кадра и доходит до marker'а, но
      его <span class="debug-value">renderInteraction</span> видит <span class="debug-value">controller === null</span>
      после <span class="debug-value">detach()</span> и тихо выходит — это и есть требование «безопасен после detach».
    </p>

    <p class="debug-note">
      <b>Остальные сценарии кадра и композиции закрыты в других секциях:</b> один resolver под local/synced overlay в одном кадре — секция
      <a href="#synchronization">«Выборочная синхронизация»</a>; touch-ховер без пана и touch-пан против ховера —
      <a href="#state-machine">«Конечный автомат»</a>; увод курсора снимает classes/маркеры/onHide —
      <a href="#cursor-lines">«Курсорные линии»</a>, <a href="#scatter">«Scatter»</a>; union() дубликата,
      orElse() и maxAxisDistance-отсечение bucket'а целиком, курсор в heterogeneous union против nearest() —
      <a href="#selection-composition">«Композиция selections»</a>; within() на границе и на крупной марке с
      contains — там же и в <a href="#scatter">«Scatter»</a> (случай C).
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, shallowRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import DemoChartView from '../shared/DemoChartView.vue'
import { FrameChart, FrameHit } from '../shared/FrameChart'

const removeMarkerOnShow = ref(false)

const attached = ref(true)
const counts = ref({ highlight: 0, marker: 0 })
const tooltipCtx = shallowRef<TooltipCtx<FrameHit> | null>(null)
const callbackRemoves = ref(0)

const { entries, push, clear } = useEventLog({ collapseRepeats: true })

const chart = markRaw(new FrameChart())

const stopTooltip = chart.onTooltip.on(ctx => {
  const wasActive = tooltipCtx.value !== null
  tooltipCtx.value = ctx
  if (ctx && !wasActive) push('onShow')
  else if (ctx) push('onPositionChange')
  else if (wasActive) push('onHide')
})

const stopCallbackRemove = chart.onCallbackRemove.on(() => callbackRemoves.value++)

const stopRender = chart.onAfterRender.on(() => {
  counts.value = { highlight: chart.highlightCount(), marker: chart.markerCount() }
})

watchEffect(() => chart.setRemoveMarkerOnShow(removeMarkerOnShow.value))

onUnmounted(() => {
  stopTooltip()
  stopCallbackRemove()
  stopRender()
})

function changeData() {
  chart.changeData()
}

function removePlot() {
  chart.removeLinePlot()
  attached.value = false
}

function restorePlot() {
  chart.restoreLinePlot()
  attached.value = true
}

function restoreMarker() {
  chart.restoreMarker()
}
</script>


<style scoped lang="scss">
@use '../shared/statusStyles.scss' as *;
</style>
