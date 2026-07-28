<template>
  <DebugSection title="Время жизни, края экрана и несколько эффектов" id="lifetime"
    description="Эффект живёт ровно EFFECT_LIFETIME_MS и снять его нельзя. Несколько эффектов живут независимо, каждый со своим таймером."
    source="src/shared/uiKit/focusEffect/focusEffect.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="fire(single)">Подсветить один раз</button>
      <button class="debug-btn" @click="fireTwice">Дважды подряд</button>
      <button class="debug-btn" @click="fireCascade">Каскадом по краям</button>
      <button class="debug-btn" @click="reset">Снять всё</button>
      <span class="debug-hint">активных: <span class="debug-value">{{ activeEffectsCount }}</span></span>
    </div>

    <p class="debug-hint">
      «Дважды подряд» — два вызова на одной цели: в наборе окажутся две записи с независимыми таймерами, поэтому
      подсветка визуально усилится и погаснет в два шага.
    </p>

    <div class="debug-stage center short">
      <button class="target" ref="single" data-focus-label="одиночная" @click="fire(single)">цель</button>
    </div>

    <p class="debug-hint">Цели по краям сцены: проверь, что рамка не обрезается и не уезжает за границу окна.</p>

    <div class="debug-stage edges">
      <button class="target small" v-for="index in 9" :key="index" :ref="setEdgeRef" :data-focus-label="`край ${index}`"
        @click="fireEdge(index - 1)">{{ index }}</button>
    </div>

    <EventLog :entries="log.entries.value" @clear="log.clear" title="Лог вызовов (время от первой записи)"
      empty="Вызовов пока не было" />
  </DebugSection>
</template>


<script setup lang="ts">
import { useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { showFocusEffect } from '@/shared/uiKit/focusEffect/focusEffect'
import { activeEffectsCount, clearFocusEffects, targetLabel } from '../shared/focusEffectControl'
import { useEventLog } from '@/pages/debug/shared/useEventLog'
import { useTimeouts } from '../shared/useTimeouts'
import EventLog from '@/pages/debug/shared/EventLog.vue'

const single = useTemplateRef<HTMLElement>('single')
const log = useEventLog({ max: 50, time: 'relative' })
const { after, cancelAll } = useTimeouts()

const edges: HTMLElement[] = []

function setEdgeRef(element: unknown) {
  if (element instanceof HTMLElement && !edges.includes(element)) edges.push(element)
}

function fire(target: { value: HTMLElement | null } | HTMLElement | null) {
  const element = target instanceof HTMLElement ? target : target?.value
  if (!element) return

  showFocusEffect(element)
  log.push(`showFocusEffect(${targetLabel(element)})`)
}

function fireTwice() {
  fire(single)
  fire(single)
}

function fireEdge(index: number) {
  fire(edges[index] ?? null)
}

function fireCascade() {
  edges.forEach((element, index) => after(index * 150, () => fire(element)))
  log.push(`каскад: ${edges.length} целей по 150 мс`)
}

function reset() {
  cancelAll()
  clearFocusEffects()
  log.push('снято принудительно (правка Set напрямую, публичного API нет)')
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
  padding: 0.5em 0.9em;
  cursor: pointer;

  &.small {
    padding: 0.3em 0.7em;
  }
}
</style>
