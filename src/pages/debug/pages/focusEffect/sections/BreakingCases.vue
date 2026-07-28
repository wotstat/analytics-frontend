<template>
  <DebugSection title="Заведомые поломки" id="breaking"
    description="Классический источник зависшего оверлея — цель, исчезнувшая под подсветкой. Здесь это воспроизводится кнопками."
    source="src/shared/uiKit/focusEffect/RectEffect.vue">

    <div class="debug-row">
      <button class="debug-btn" @click="removeUnderEffect">Подсветить и снести цель из DOM</button>
      <button class="debug-btn" @click="hideUnderEffect">Подсветить и спрятать (display: none)</button>
      <button class="debug-btn" @click="zeroUnderEffect">Подсветить и сжать до нуля</button>
      <button class="debug-btn" @click="restore">Вернуть как было</button>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>состояние цели</th>
          <th>значение</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>в DOM</th>
          <td :class="mounted.toString()">{{ mounted }}</td>
        </tr>
        <tr>
          <th>скрыта</th>
          <td :class="(!hidden).toString()">{{ hidden }}</td>
        </tr>
        <tr>
          <th>размер</th>
          <td>{{ collapsed ? '0 × 0' : '200 × 60' }}</td>
        </tr>
        <tr>
          <th>активных эффектов</th>
          <td>{{ activeEffectsCount }}</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-stage center short">
      <button class="target" ref="target" data-focus-label="ломаемая" v-if="mounted"
        :class="{ hidden, collapsed }">цель</button>
      <span class="debug-hint" v-else>цель снесена из DOM</span>
    </div>

    <p class="debug-note">
      Ожидаемое поведение во всех трёх случаях — рамка просто исчезает: <span class="debug-value">RectEffect</span>
      каждый кадр проверяет <span class="debug-value">element.isConnected</span> и нулевой размер, и в обоих случаях
      обнуляет прямоугольник. То есть зависшего оверлея быть не должно, а запись в наборе доживёт свои
      {{ EFFECT_LIFETIME_MS }} мс невидимой. Если рамка всё же осталась на экране — это баг.
    </p>

    <EventLog :entries="log.entries.value" @clear="log.clear" title="Лог вызовов (время от первой записи)"
      empty="Вызовов пока не было" />
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { showFocusEffect } from '@/shared/uiKit/focusEffect/focusEffect'
import { activeEffectsCount, EFFECT_LIFETIME_MS } from '../shared/focusEffectControl'
import { useEventLog } from '@/pages/debug/shared/useEventLog'
import { useTimeouts } from '../shared/useTimeouts'
import EventLog from '@/pages/debug/shared/EventLog.vue'

const target = useTemplateRef<HTMLElement>('target')
const mounted = ref(true)
const hidden = ref(false)
const collapsed = ref(false)
const log = useEventLog({ max: 50, time: 'relative' })
const { after } = useTimeouts()

function fireThen(text: string, action: () => void) {
  if (!target.value) return

  showFocusEffect(target.value)
  log.push(`подсветил, через 200 мс — ${text}`)
  after(200, () => {
    action()
    log.push(text)
  })
}

function removeUnderEffect() {
  fireThen('снёс цель из DOM', () => mounted.value = false)
}

function hideUnderEffect() {
  fireThen('display: none', () => hidden.value = true)
}

function zeroUnderEffect() {
  fireThen('сжал до нулевого размера', () => collapsed.value = true)
}

function restore() {
  mounted.value = true
  hidden.value = false
  collapsed.value = false
  log.push('вернул цель')
}

</script>


<style scoped lang="scss">
.target {
  background: #ffffff14;
  border: 1px solid #ffffff30;
  border-radius: 8px;
  color: inherit;
  font-family: inherit;
  font-size: 13px;
  width: 200px;
  height: 60px;

  &.hidden {
    display: none;
  }

  &.collapsed {
    width: 0;
    height: 0;
    padding: 0;
    border-width: 0;
  }
}
</style>
