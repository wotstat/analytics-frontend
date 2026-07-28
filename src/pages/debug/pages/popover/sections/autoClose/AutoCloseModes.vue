<template>
  <DebugSection title="PopoverAutoClose: три условия закрытия" id="auto-close"
    description="Три поповера рядом, отличаются только closeOnOutsideWindow. Открой все и медленно тяни viewportOffset или прокручивай страницу — они обязаны закрываться в разное время и в предсказуемом порядке: popover, потом popover-full, потом target."
    source="src/shared/uiKit/popover/PopoverAutoClose.vue">

    <div class="debug-row">
      <PlacementSelect v-model="placement" label="placement" />

      <label class="debug-control">
        <span class="debug-label">viewportOffset</span>
        <input type="range" min="0" max="300" v-model.number="viewportOffset">
        <span class="debug-value">{{ viewportOffset }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">рамка viewportOffset</span>
        <input type="checkbox" v-model="showViewportBox">
      </label>

      <button class="debug-btn" @click="setAll(true)">Открыть все</button>
      <button class="debug-btn" @click="setAll(false)">Закрыть все</button>
    </div>

    <div class="debug-stage center short">
      <div class="debug-row cases">
        <AutoCloseCase v-for="item in cases" :key="item.mode" v-model="open[item.mode]" :mode="item.mode"
          :hint="item.hint" :viewport-offset="viewportOffset" :placement="placement ?? 'top'" />
      </div>
    </div>

    <ViewportBox :display="showViewportBox" :offset="viewportOffset" />

    <div class="debug-grid state">
      <table class="debug-table">
        <thead>
          <tr>
            <th>closeOnOutsideWindow</th>
            <th>условие закрытия</th>
            <th>открыт</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cases" :key="item.mode">
            <th>{{ item.mode }}{{ item.mode === 'target' ? ' (по умолчанию)' : '' }}</th>
            <td>{{ item.hint }}</td>
            <td :class="open[item.mode] ? 'true' : 'false'">{{ open[item.mode] }}</td>
          </tr>
        </tbody>
      </table>

      <EventLog :entries="entries" @clear="clear" title="Лог открытий и закрытий"
        empty="Открой поповеры и начни сжимать viewport" />
    </div>

    <p class="debug-note">
      Разница видна лучше всего на ползунке: <span class="debug-value">popover</span> закроется почти сразу — ему
      достаточно того, что карточка не влезла целиком ни в одном placement. <span
        class="debug-value">popover-full</span>
      держится, пока карточка хоть краем в границах. <span class="debug-value">target</span> (режим по умолчанию)
      живёт дольше всех: ему нужно, чтобы за границу ушла сама кнопка-цель. Порядок в логе — главный признак,
      что режимы не перепутаны.
    </p>

    <p class="debug-note">
      Кроме выхода за границы <span class="debug-value">PopoverAutoClose</span> закрывается по Escape и по указателю
      вне поповера: на десктопе — уже по pointerdown, на тач-устройствах — по pointerup, если это был тап (сдвиг
      меньше 5 px и меньше 500 мс), чтобы поповер не исчезал от начала скролла. Клик по самой цели не считается
      «снаружи» — поэтому кнопка-цель работает как переключатель.
    </p>

    <p class="debug-note">
      Пальцем: кнопка «Открыть все» не является целью ни одного из поповеров, поэтому на тач-устройстве тот же тап
      закроет их обратно — это ожидаемое поведение, а не баг страницы; открывай тапом по самим целям.
      Ещё проверь, что начало скролла (палец поехал) не закрывает поповер, а короткий тап по пустому месту — закрывает.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { CloseOnOutsideWindow, PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import AutoCloseCase from './AutoCloseCase.vue'
import EventLog from '../../shared/EventLog.vue'
import PlacementSelect from '../../shared/PlacementSelect.vue'
import ViewportBox from '../../shared/ViewportBox.vue'
import { useEventLog } from '../../shared/useEventLog'

const cases = [
  { mode: 'popover', hint: 'карточка не влезла целиком' },
  { mode: 'popover-full', hint: 'карточка целиком за границей' },
  { mode: 'target', hint: 'цель целиком за границей' },
] as const satisfies readonly { mode: CloseOnOutsideWindow, hint: string }[]

const placement = ref<PlacementWithModifiers | null>('top')
const viewportOffset = ref(10)
const showViewportBox = ref(false)

const open = ref<Record<CloseOnOutsideWindow, boolean>>({ 'popover': false, 'popover-full': false, 'target': false })

const { entries, push, clear } = useEventLog()

let last = { ...open.value }
watch(open, value => {
  for (const item of cases) {
    if (value[item.mode] === last[item.mode]) continue
    push(`${item.mode}: ${value[item.mode] ? 'открылся' : 'закрылся'}`)
  }

  last = { ...value }
}, { deep: true })

function setAll(value: boolean) {
  open.value = { 'popover': value, 'popover-full': value, 'target': value }
}

</script>


<style scoped lang="scss">
.cases {
  gap: 0.5em 1.5em;
}

.state {
  --debug-grid-min: 320px;
}

.debug-table th,
.debug-table td {
  overflow-wrap: anywhere;
}
</style>
