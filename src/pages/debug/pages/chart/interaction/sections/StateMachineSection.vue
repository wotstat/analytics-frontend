<template>
  <DebugSection title="Конечный автомат ввода" id="state-machine"
    description="Один DOM-обработчик на событие, всё решение — в состоянии. Текущее состояние показано живьём: если жест не сработал, смотреть надо сюда, а не в компоненты."
    source="src/shared/uiKit/chart/universalChart/interaction/baseInteractionController/">

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
        <span class="debug-label">курсорные линии</span>
        <input type="checkbox" v-model="hoverEnabled">
      </label>

      <span class="debug-hint">
        Без курсорных линий у контроллера нет ни одного interaction-компонента, и mayHover отвечает false.
      </span>
    </div>

    <div class="debug-row current">
      <span class="debug-label">текущее состояние</span>
      <span class="debug-value state">{{ current }}</span>
    </div>

    <DemoChartView :chart="chart" :height="220" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>состояние</th>
          <th>ввод</th>
          <th>вход</th>
          <th>активно</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in stateList" :key="item.name">
          <th>{{ item.name }}</th>
          <td>{{ item.input }}</td>
          <td class="enter">{{ item.enter }}</td>
          <td :class="item.name === current ? 'true' : 'false'">{{ item.name === current ? 'да' : '—' }}</td>
        </tr>
      </tbody>
    </table>

    <EventLog :entries="entries" title="Переходы автомата и клики" empty="Переходов ещё не было" @clear="clear" />

    <div class="debug-col">
      <p class="debug-hint" v-for="item in stateList" :key="item.name">
        <span class="debug-value">{{ item.name }}</span> — {{ item.note }}
      </p>
    </div>

    <p class="debug-note">
      Мышью: наведи — <span class="debug-value">MouseHoverState</span>; зажми ЛКМ —
      <span class="debug-value">MousePanState</span>, если пан разрешён: перемещение графика начинается сразу.
      Отпускание при максимальном смещении до 4 px даёт клик после завершения пана.
      При отключённом пане нажатие переходит в <span class="debug-value">MousePressState</span>.
      Отпускание возвращает тот же экземпляр ховер-состояния через <span class="debug-value">returnToState</span>.
      Возврат после перетаскивания дальше 4 px в исходную точку не даёт клик.
      Нажми в 1 px от края, выйди за него на 2 px и вернись: клика тоже быть не должно,
      даже если указатель захвачен и общее смещение осталось в пределах 4 px.
    </p>

    <p class="debug-note">
      Пальцем: коснись и держи не двигаясь — через 200 мс (при разрешённом пане) загорится
      <span class="debug-value">TouchHoverState</span>. Выключи pan — порог падает до 75 мс, ховер появляется заметно
      резвее. Коснись и сразу отпусти в пределах 4 px — клик; удержание до ховера уже не считается кликом.
      Первое движение в разрешённую сторону — <span class="debug-value">TouchPanState</span>, без порога расстояния.
      Отпускание при смещении до 4 px также даёт клик. Поставь
      второй палец из любого состояния — <span class="debug-value">TouchZoomState</span>; сними один палец — вернёшься
      в <span class="debug-value">TouchPanState</span>, а не в ховер. Поставь третий палец, потом сними первый:
      третий подхватывается как активный без разрыва жеста. При выключенных пане и ховере касание всё равно
      запускает <span class="debug-value">AwaitingTouchPanOrHover</span> для распознавания клика.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { InteractionDirection } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import DemoChartView from '../shared/DemoChartView.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { CursorChart } from '../shared/CursorChart'
import { panDirections } from '../shared/panDirections'
import { stateList, stateName, type StateName } from '../shared/states'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const panDirection = ref<InteractionDirection>('horizontal')
const zoom = ref(true)
const hoverEnabled = ref(true)

const current = ref<StateName>('StartState')
const { entries, push, clear } = useEventLog({ collapseRepeats: true })

const chart = markRaw(new CursorChart())
chart.setSeries([syntheticSeries('smooth', 3, 90)])

const stopStateLog = chart.controller.onStateChanged.on(() => {
  const name = stateName(chart.controller.currentState)
  current.value = name
  push(name)
})
const stopClickLog = chart.callback.on('click', () => push('click'))

watchEffect(() => chart.setZoom({
  zoom: zoom.value,
  panDirection: panDirection.value,
  autoFitFollow: true,
}))

watchEffect(() => chart.setCursor({
  verticalLine: hoverEnabled.value,
  horizontalLine: hoverEnabled.value,
}))

onUnmounted(() => {
  stopStateLog()
  stopClickLog()
})

</script>


<style scoped lang="scss">
.current {
  align-items: baseline;

  .state {
    font-size: 15px;
    font-weight: bold;
    color: var(--blue-thin-color);
  }
}

.enter {
  text-align: left;
}
</style>
