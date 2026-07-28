<template>
  <DebugSection title="Императивный API" id="imperative-api"
    description="setDisplayed, display, hide, accept, wrong — методы из defineExpose. displayDelay специально выставлен большим, чтобы отличить display() от display(force=true). Каждый вызов и реальное изменение showBubble попадают в лог отдельными строками — по ним видно, где вызов реально что-то поменял, а где стал тихим no-op."
    source="src/shared/ui/tipBubble/TipBubble.vue, src/shared/uiKit/tipBubble/useTipBubble.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="call('display', () => bubble?.display())">display()</button>
      <button class="debug-btn" @click="call('display(force)', () => bubble?.display(true))">display(force)</button>
      <button class="debug-btn" @click="call('hide', () => bubble?.hide())">hide()</button>
      <button class="debug-btn"
        @click="call('setDisplayed(true)', () => bubble?.setDisplayed(true))">setDisplayed(true)</button>
      <button class="debug-btn"
        @click="call('setDisplayed(true, force)', () => bubble?.setDisplayed(true, true))">setDisplayed(true,
        force)</button>
      <button class="debug-btn"
        @click="call('setDisplayed(false)', () => bubble?.setDisplayed(false))">setDisplayed(false)</button>
      <button class="debug-btn" @click="call('accept', () => bubble?.accept())">accept()</button>
      <button class="debug-btn" @click="call('wrong', () => bubble?.wrong())">wrong()</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">displayDelay</span>
        <input type="number" min="0" step="100" v-model.number="displayDelay">
        <span class="debug-hint">мс</span>
      </label>
      <button class="debug-btn" @click="apply">Применить displayDelay (пересоздаст бабл)</button>
      <button class="debug-btn" @click="reset">Сбросить localStorage и пересоздать</button>
    </div>

    <div class="debug-stage center">
      <div class="anchor" :key="generation">
        <span>цель</span>
        <TipBubble ref="bubble" class="spot" bubbleKey="debug-tipbubble-imperative" :displayDelay direction="right"
          v-slot="{ direction }">
          <p class="content">
            <span class="spacer" :class="`align-${direction}`"></span>
            Императивный API: посмотри лог ниже
          </p>
        </TipBubble>
      </div>
    </div>

    <EventLog :entries title="Лог вызовов и фактических изменений" empty="Нажми любую кнопку выше" @clear="clear" />

    <p class="debug-note">
      После <span class="debug-value">accept()</span> сработает <span class="debug-value">state.accepted = true</span>,
      и <span class="debug-value">changeDisplayed()</span> внутри useTipBubble.ts начинает молча выходить по первой
      же строке (<span class="debug-value">if (state.value.accepted) return</span>) — все последующие
      display()/hide()/setDisplayed() на этом смонтированном экземпляре становятся no-op. В логе это видно как
      «вызван …», но без строки «показан/скрыт» следом. Чтобы оживить бабл заново, нужно пересоздать компонент —
      кнопка выше делает это одновременно со сбросом localStorage.
    </p>

    <p class="debug-note">
      На тач-устройстве: наведения тут нет — попробуй тапнуть по самому бабблу (иконке) на сцене, когда он показан.
      Разворот по тапу управляется отдельным путём (`@click`, включён только при `navigator.maxTouchPoints > 0`) в
      обход mousedown/mouseup с порогом смещения 20px, которым разворот управляется на десктопе.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TipBubble from '@/shared/ui/tipBubble/TipBubble.vue'
import { debugInfo } from '@/shared/uiKit/tipBubble/useTipBubble'
import EventLog from '../shared/EventLog.vue'
import { useEventLog } from '../shared/useEventLog'
import { resetBubbleKeys } from '../shared/storage'

const KEY = 'debug-tipbubble-imperative'

const displayDelay = ref(1200)
const generation = ref(0)
const bubble = useTemplateRef<InstanceType<typeof TipBubble>>('bubble')

const { entries, push, clear } = useEventLog()

function call(label: string, fn: () => void) {
  push(`вызван: ${label}`)
  fn()
}

function apply() {
  generation.value++
}

function reset() {
  resetBubbleKeys(KEY)
  generation.value++
  clear()
}

let lastDisplayed: boolean | undefined
watch(() => debugInfo.value.bubbles.get(KEY)?.props?.displayed, (value) => {
  if (value === undefined || value === lastDisplayed) return
  lastDisplayed = value
  push(value ? 'фактически показан' : 'фактически скрыт')
})

</script>


<style scoped lang="scss">
.anchor {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.4em 0.8em;
  background: var(--debug-surface);
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  font-size: 13px;
}

.spot {
  position: absolute;
  top: -6px;
  right: -6px;
}

.content {
  padding: 1.2px 5px;
  color: #fff;
  font-size: 13px;
  line-height: 1.2;

  .spacer {
    width: 13px;
    height: 10px;

    &.align-left {
      float: left;
    }

    &.align-right {
      float: right;
    }
  }
}
</style>
