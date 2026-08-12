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

    <EventLog :entries="entries" title="Переходы автомата" empty="Переходов ещё не было" @clear="clear" />

    <div class="debug-col">
      <p class="debug-hint" v-for="item in stateList" :key="item.name">
        <span class="debug-value">{{ item.name }}</span> — {{ item.note }}
      </p>
    </div>

    <p class="debug-note">
      Мышью: наведи — <span class="debug-value">MouseHoverState</span>; зажми ЛКМ — сразу
      <span class="debug-value">MousePanState</span> (порога расстояния нет, поэтому «клик по графику» — это уже пан
      нулевой длины); отпусти — <span class="debug-value">returnToState</span> возвращает тот же самый экземпляр
      ховер-состояния, а не создаёт новый. Выключи и пан, и ховер: мышь всё равно уходит в
      <span class="debug-value">MouseHoverState</span> — <span class="debug-value">StartState</span> проверяет
      mayPan/mayHover только для тача.
    </p>

    <p class="debug-note">
      Пальцем: коснись и держи не двигаясь — через 200 мс (при разрешённом пане) загорится
      <span class="debug-value">TouchHoverState</span>. Выключи pan — порог падает до 75 мс, ховер появляется заметно
      резвее. Коснись и сразу веди — <span class="debug-value">TouchPanState</span>, ховера не будет вовсе. Поставь
      второй палец из любого состояния — <span class="debug-value">TouchZoomState</span>; сними один палец — вернёшься
      в <span class="debug-value">TouchPanState</span>, а не в ховер. Поставь третий палец, потом сними первый:
      третий подхватывается как активный без разрыва жеста. При выключенных пане и ховере касание не переводит
      автомат никуда — он остаётся в <span class="debug-value">StartState</span>.
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

watchEffect(() => chart.setZoom({
  zoom: zoom.value,
  panDirection: panDirection.value,
  autoFitFollow: true,
}))

watchEffect(() => chart.setCursor({
  verticalLine: hoverEnabled.value,
  horizontalLine: hoverEnabled.value,
}))

onUnmounted(() => stopStateLog())

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
