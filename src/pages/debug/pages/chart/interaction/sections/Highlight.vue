<template>
  <DebugSection title="Highlight и exposeHighlights" id="highlight"
    description="Highlight подсвечивает ближайший stroke классом через diff SVG-targets между кадрами; ChartTooltip.exposeHighlights публикует его snapshot в TooltipCtx, а isHighlighted() отмечает точки той же серии направленным сопоставлением identity — не пересечением SVG-targets у point и stroke, у которых они разные."
    source="src/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">сценарий</span>
        <select v-model="preset">
          <option v-for="item in highlightPresets" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">maxDistance, px</span>
        <input type="number" v-model.number="maxDistance" min="0" max="60" step="1">
      </label>

      <label class="debug-control">
        <span class="debug-label">второй Highlight, тот же класс</span>
        <input type="checkbox" v-model="secondSameClass">
      </label>

      <label class="debug-control">
        <span class="debug-label">второй Highlight, другой класс</span>
        <input type="checkbox" v-model="secondDiffClass">
      </label>

      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
      <button class="debug-btn" @click="recreate">Пересоздать график (detach контроллера)</button>
    </div>

    <div ref="stage">
      <DemoChartView :chart="chart" :height="300" />
    </div>

    <div class="debug-row current">
      <span class="debug-label">оба порядка addComponent() дают одинаковый TooltipCtx</span>
      <span class="debug-value" :class="orderClass">{{ orderLabel }}</span>
    </div>

    <div class="debug-row current">
      <span class="debug-label">мутаций class в DOM (subtree, всего)</span>
      <span class="debug-value count">{{ classMutations }}</span>
      <button class="debug-btn" @click="classMutations = 0">сбросить счётчик</button>

      <span class="debug-label">инстансов графика создано</span>
      <span class="debug-value count">{{ instanceCount }}</span>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>серия</th>
          <th>y</th>
          <th>distance, px</th>
          <th>isHighlighted(lineHighlight)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(hit, index) in ctx?.hits ?? []" :key="index" :class="{ highlighted: isHighlighted(hit) }">
          <td>{{ seriesLabel(hit) }}</td>
          <td>{{ hit.datum.y.toFixed(1) }}</td>
          <td>{{ hit.distance.toFixed(1) }}</td>
          <td>{{ isHighlighted(hit) ? 'да' : 'нет' }}</td>
        </tr>
        <tr v-if="!ctx || ctx.hits.length === 0">
          <td colspan="4" class="empty">selection пуст</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <b>prepare/render и порядок addComponent().</b> На этом графике одновременно живут два
      <span class="debug-value">ChartTooltip</span> с одинаковыми <span class="debug-value">selection</span> и
      <span class="debug-value">exposeHighlights</span>: один добавлен в контроллер <i>до</i>
      <span class="debug-value">lineHighlight</span>, второй — <i>после</i>. Строка выше сравнивает их
      <span class="debug-value">TooltipCtx</span> покадрово по составу hits и результату
      <span class="debug-value">isHighlighted()</span> и обязана показывать «да» всегда, пока тултип активен: к моменту
      <span class="debug-value">renderInteraction</span> любого компонента <span class="debug-value">prepareInteraction</span>
      уже отработал у всех — это и есть барьер между фазами prepare и render, а не свойство конкретного тултипа.
    </p>

    <p class="debug-note">
      <b>Series membership.</b> <span class="debug-value">lineHighlight</span> подсвечивает
      <span class="debug-value">line-stroke</span> hit ближайшей линии — у него нет собственных point-таргетов.
      Тултип же показывает <span class="debug-value">line-point</span> hits, у которых просто нет общих SVG-targets со
      stroke. Колонка «isHighlighted» тем не менее верна: <span class="debug-value">isAmongSelected()</span> сравнивает
      identity точки и её memberships с identity выбранного stroke, а не DOM.
      Направленность видна сразу: подсветка серии переводит «да» на все её точки, но подсветка одной точки не сделала
      бы hit серии highlighted — здесь это не проверить в UI напрямую, потому что точка не Highlight-selection.
    </p>

    <p class="debug-note">
      <b>Target diff без лишнего toggle.</b> Счётчик мутаций растёт только при реальной смене набора targets:
      подведи курсор в стабильную зону одной линии и подвигай в её пределах — счётчик почти не растёт, несмотря на то
      что каждый кадр компонент честно проходит prepare и сравнивает previous/current set. Заметный скачок — это
      переход подсветки на другую линию или полный уход selection в пусто.
    </p>

    <p class="debug-note">
      <b>Два Highlight, разные классы, один target.</b> Включи «другой класс»: <span class="debug-value">secondDiffClass</span>
      читает тот же <span class="debug-value">strokeNearest</span>, что и <span class="debug-value">lineHighlight</span>,
      и вешает свой класс <span class="debug-value">flagged-highlighted</span> на тот же path одновременно с
      <span class="debug-value">line-highlighted</span>. Оба diff работают независимо и не мешают друг другу — это
      нормальный случай, ради которого <span class="debug-value">Highlight</span> не завязан на конкретный class extension.
    </p>

    <p class="debug-note">
      <b>Два Highlight, один класс — ответственность вызывающего.</b> Включи «тот же класс» и наведи курсор на линию:
      класс держат сразу два независимых <span class="debug-value">Highlight</span>-инстанса без reference counting.
      Теперь выключи чекбокс, не уводя курсор: <span class="debug-value">
        secondSameClass.detach()</span> снимает класс со своего previous target немедленно, а
      <span class="debug-value">lineHighlight</span> ничего не переисчисляет — его собственный previous/current target
      set не изменился, diff не находит перехода и класс <b>не восстанавливается</b>, хотя lineHighlight по-прежнему
      считает эту линию выбранной. Подвинь курсор на другую линию и обратно — на новой цели класс появится снова,
      потому что там действительно произошёл переход. Это не баг: конфликт нескольких Highlight на одном классе
      framework сознательно не разрешает, синхронизация — забота caller.
    </p>

    <p class="debug-note">
      <b>Пересоздать график.</b> Кнопка выше создаёт новый инстанс <span class="debug-value">HighlightChart</span> и
      подставляет его в <span class="debug-value">DemoChartView</span> — тот сам вызывает
      <span class="debug-value">dispose()</span> у старого чарта, что вызывает <span class="debug-value">detach()</span>
      у контроллера и снимает classes/DOM всех interaction-компонентов без ожидания следующего кадра. Счётчик
      мутаций и «оба порядка совпадают» сбрасываются вместе с тултипом — старого состояния не остаётся.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { useMutationObserver } from '@vueuse/core'
import { computed, markRaw, onUnmounted, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import DemoChartView from '../shared/DemoChartView.vue'
import { defaultHighlightConfig, HighlightChart, HighlightPointHit, highlightPresets, HighlightPreset, OrderCheck } from '../shared/HighlightChart'

const preset = ref<HighlightPreset>(defaultHighlightConfig().preset)
const maxDistance = ref(defaultHighlightConfig().maxDistance)
const secondSameClass = ref(false)
const secondDiffClass = ref(false)

const ctx = shallowRef<TooltipCtx<HighlightPointHit> | null>(null)
const orderCheck = ref<OrderCheck>({ active: false, match: true })
const classMutations = ref(0)
const instanceCount = ref(1)

const stage = useTemplateRef<HTMLElement>('stage')

function createChart() {
  return markRaw(new HighlightChart({ zoom: true }))
}

const chart = shallowRef(createChart())

let stopTooltip: (() => void) | null = null
let stopOrder: (() => void) | null = null

function subscribe() {
  stopTooltip?.()
  stopOrder?.()
  stopTooltip = chart.value.onTooltip.on(next => ctx.value = next)
  stopOrder = chart.value.onOrderCheck.on(next => orderCheck.value = next)
}

subscribe()

watchEffect(() => chart.value.setConfig({
  preset: preset.value,
  maxDistance: maxDistance.value,
  secondSameClass: secondSameClass.value,
  secondDiffClass: secondDiffClass.value,
}))

// subtree: класс меняется на существующих path линий, а не внутри .hover-components
useMutationObserver(stage, mutations => {
  classMutations.value += mutations.filter(m => m.type === 'attributes' && m.attributeName === 'class').length
}, { attributes: true, attributeFilter: ['class'], subtree: true })

const orderClass = computed(() => !orderCheck.value.active ? 'muted' : orderCheck.value.match ? 'ok' : 'bad')
const orderLabel = computed(() => {
  if (!orderCheck.value.active) return 'нет активного тултипа'
  return orderCheck.value.match ? 'да' : 'НЕТ — расхождение!'
})

function recreate() {
  ctx.value = null
  chart.value = createChart()
  instanceCount.value++
  subscribe()
}

onUnmounted(() => {
  stopTooltip?.()
  stopOrder?.()
})

function seriesLabel(hit: HighlightPointHit) {
  return hit.source === chart.value.lineASource ? 'A' : 'B'
}

function isHighlighted(hit: HighlightPointHit) {
  return ctx.value?.isHighlighted(hit, chart.value.lineHighlight) ?? false
}
</script>


<style scoped lang="scss">
@use '../shared/statusStyles.scss' as *;

.highlighted td {
  font-weight: bold;
  color: white;
}
</style>
