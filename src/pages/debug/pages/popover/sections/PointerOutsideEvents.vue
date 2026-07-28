<template>
  <DebugSection title="События указателя: down / up / click вне поповера" id="pointer-events"
    description="Popover сам ничего не закрывает, он только сообщает о указателе вне себя. Тыкай по пустому месту, по кнопке рядом, по самой цели и по карточке — в лог должны попасть только те тычки, которые действительно снаружи."
    source="src/shared/uiKit/popover/Popover.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">display</span>
        <input type="checkbox" v-model="display">
      </label>

      <label class="debug-control">
        <span class="debug-label">interactive</span>
        <input type="checkbox" v-model="interactive">
      </label>

      <label class="debug-control">
        <span class="debug-label">закрывать по pointerDownOutside</span>
        <input type="checkbox" v-model="closeOnDown">
      </label>

      <button class="debug-btn" @click="pokes++">кнопка рядом (тычков: {{ pokes }})</button>
    </div>

    <div class="debug-stage center short">
      <button class="debug-btn" ref="target" @click="display = !display">цель (клик по ней — не «снаружи»)</button>
    </div>

    <PopoverStyled :target="target" :display="display" :placement="['right-float', 'top-float']" :arrow-size="7"
      :interactive="interactive" @pointer-down-outside="event => log('pointerDownOutside', event)"
      @pointer-up-outside="event => log('pointerUpOutside', event)"
      @pointer-click-outside="event => log('pointerClickOutside', event)">
      <div class="card-body">
        <div>тыкай сюда и вокруг</div>
        <div class="hint">клик внутри карточки в лог не попадает, пока interactive: true</div>
      </div>
    </PopoverStyled>

    <EventLog :entries="entries" @clear="clear" empty="Пока ни одного тычка снаружи" />

    <p class="debug-note">
      Что не считается «снаружи»: клик по содержимому поповера и клик по самой цели — цель проверяется через
      <span class="debug-value">contains</span>, поэтому кнопка-цель спокойно работает переключателем и не закрывает
      поповер сама себя. Выключи <span class="debug-value">interactive</span> и потыкай прямо в карточку: события
      начнут приходить, потому что указатель сквозь неё проходит и попадает в элемент под ней. Это же значит, что для
      виртуальной цели (у неё нет DOM-узла) «внутри цели» не бывает никогда.
    </p>

    <p class="debug-note">
      Пальцем: последовательность другая — на касание приходит pointerDownOutside, на отпускание pointerUpOutside и
      затем pointerClickOutside. Поэтому закрытие по pointerDown (галочка выше) на тач-устройстве закрывает поповер в
      момент начала скролла: проведи пальцем от карточки вниз и увидишь. Именно из-за этого
      <span class="debug-value">PopoverAutoClose</span> на тач закрывается по короткому тапу на up, а на десктопе — по
      down. Ещё проверь долгое нажатие с вызовом системного меню и скролл двумя пальцами.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'
import EventLog from '../shared/EventLog.vue'
import { useEventLog } from '../shared/useEventLog'

const target = useTemplateRef<HTMLElement>('target')

const display = ref(true)
const interactive = ref(true)
const closeOnDown = ref(false)
const pokes = ref(0)

const { entries, push, clear } = useEventLog()

function log(name: string, event: PointerEvent) {
  push(`${name} — ${event.pointerType || 'н/д'} @ ${Math.round(event.clientX)}, ${Math.round(event.clientY)}`)
  if (name === 'pointerDownOutside' && closeOnDown.value) display.value = false
}

</script>


<style scoped lang="scss">
.card-body {
  padding: 0.5em 0.7em;
  font-size: 13px;
  line-height: 1.4;
  max-width: 240px;

  .hint {
    font-size: 11px;
    color: #ffffff80;
  }
}
</style>
