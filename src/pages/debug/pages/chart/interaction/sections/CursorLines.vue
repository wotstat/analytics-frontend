<template>
  <DebugSection title="Курсорные линии и ввод" id="cursor-lines"
    description="Первая вертикаль новой архитектуры: cursorSelection() отдаёт один hit с anchor в точке курсора, VerticalLine и HorizontalLine рисуют по одной SVG-линии на каждую уникальную координату. Данных в selections ещё нет — здесь проверяется весь кадр целиком."
    source="src/shared/uiKit/chart/universalChart/interaction/composable/components/lines/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">вертикальная линия</span>
        <input type="checkbox" v-model="verticalLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">горизонтальная линия</span>
        <input type="checkbox" v-model="horizontalLine">
      </label>

      <label class="debug-control">
        <span class="debug-label">offset</span>
        <input type="number" v-model.number="offset" min="0" max="60" step="5">
      </label>

      <label class="debug-control">
        <span class="debug-label">класс accent</span>
        <input type="checkbox" v-model="accent">
      </label>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="toggleLater">Переключить горизонтальную через 1,5 с</button>
      <button class="debug-btn" @click="optionsLater">Сменить offset и класс через 1,5 с</button>
      <span class="debug-hint" v-if="pending">{{ pending }} — держи курсор на графике</span>
      <span class="debug-hint" v-else>Наведи курсор, нажми кнопку и не убирай курсор: изменение прилетит во время
        активного ховера.</span>
    </div>

    <div class="debug-row current">
      <span class="debug-label">линий в DOM</span>
      <span class="debug-value count">{{ lineCount }}</span>
      <span class="debug-hint">Уведи курсор — обязан стать 0. Это и есть кадр после onHoverEnd.</span>
    </div>

    <div ref="stage">
      <DemoChartView :chart="chart" :height="260" />
    </div>

    <EventLog :entries="entries" title="Ховер" empty="Ховера ещё не было" @clear="clear" />

    <p class="debug-note">
      Компоненты больше не хранят собственный <span class="debug-value">lastPoint</span> и не снимают себя в хуках.
      <span class="debug-value">onHoverBegin/Update/End</span> контроллера только пишут local input и возвращают
      <span class="debug-value">true</span>, а весь DOM трогает <span class="debug-value">renderInteraction</span>
      следующего кадра. Поэтому увод курсора обязан привести к кадру, в котором линий не осталось: если счётчик выше
      застрял на 1 или 2, сломан именно возврат <span class="debug-value">true</span> из
      <span class="debug-value">onHoverEnd</span>.
    </p>

    <p class="debug-note">
      Направление ховера теперь даёт контроллер: если подключён хоть один компонент с
      <span class="debug-value">prepareInteraction</span>/<span class="debug-value">renderInteraction</span>, он
      отвечает <span class="debug-value">'all'</span>. Выключи обе линии — на графике не останется ни одного
      interaction-компонента, и <span class="debug-value">mayHover</span> станет
      <span class="debug-value">false</span>. Мышью это незаметно (<span class="debug-value">StartState</span>
      пускает мышь в ховер без проверок), а пальцем ховер в этом состоянии не стартует вовсе — на это и смотреть.
    </p>

    <p class="debug-note">
      Пальцем: коснись и держи не двигаясь — линии появятся вместе с
      <span class="debug-value">TouchHoverState</span>. Пан здесь разрешён по X, поэтому порог ожидания 200 мс, а
      сдвиг пальца до срабатывания уводит в пан без ховера.
    </p>

    <p class="debug-note">
      Кнопки задержки закрывают два отдельных случая: <span class="debug-value">addComponent</span> /
      <span class="debug-value">removeComponent</span> во время активного ховера — новый компонент обязан увидеть
      текущий local input контроллера уже на ближайшем кадре, без движения курсора; и
      <span class="debug-value">updateOptions</span> во время активного ховера — offset и классы обязаны
      примениться там же, на месте, а не после следующего движения.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, useTemplateRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import DemoChartView from '../shared/DemoChartView.vue'
import { CursorChart } from '../shared/CursorChart'

const verticalLine = ref(true)
const horizontalLine = ref(true)
const offset = ref(0)
const accent = ref(false)

const lineCount = ref(0)
const pending = ref<string | null>(null)

const stage = useTemplateRef<HTMLElement>('stage')
const { entries, push, clear } = useEventLog({ collapseRepeats: true })

const chart = markRaw(new CursorChart())
chart.setSeries([syntheticSeries('smooth', 3, 90)])

const stopBegin = chart.callback.on('hoverBegin', () => push('hoverBegin'))
const stopUpdate = chart.callback.on('hoverUpdate', () => push('hoverUpdate'))
const stopEnd = chart.callback.on('hoverEnd', () => push('hoverEnd'))

// Счётчик читается из DOM намеренно: set semantics — это ровно про число элементов, а не про состояние компонента
const stopRender = chart.onAfterRender.on(() => {
  const count = stage.value?.querySelectorAll('.hover-components line').length ?? 0
  if (count !== lineCount.value) lineCount.value = count
})

let timer: ReturnType<typeof setTimeout> | null = null

function later(label: string, action: () => void) {
  if (timer) clearTimeout(timer)
  pending.value = label
  timer = setTimeout(() => {
    action()
    pending.value = null
    timer = null
  }, 1500)
}

function toggleLater() {
  later('горизонтальная линия переключится', () => horizontalLine.value = !horizontalLine.value)
}

function optionsLater() {
  later('offset и класс сменятся', () => {
    offset.value = offset.value === 0 ? 30 : 0
    accent.value = !accent.value
  })
}

watchEffect(() => chart.setCursor({
  verticalLine: verticalLine.value,
  horizontalLine: horizontalLine.value,
  offset: offset.value,
  accent: accent.value,
}))

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  stopBegin()
  stopUpdate()
  stopEnd()
  stopRender()
})

</script>


<style scoped lang="scss">
@use '../shared/statusStyles.scss' as *;
</style>
