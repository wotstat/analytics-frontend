<template>
  <DebugSection title="Значение: строка или объект" id="value-shape"
    description="Строка — это сахар для { text }. Объект добавляет параметры поповера, отдельный target и disabled. Меняй параметры и смотри, как переезжает карточка; «открыть программно» держит тултип открытым, чтобы крутить контролы, не убирая указатель."
    source="src/shared/uiKit/tooltip/types.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">значение</span>
        <select v-model="mode">
          <option value="string">строка</option>
          <option value="object">объект</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">text</span>
        <input type="text" v-model="text">
      </label>

      <PlacementSelect v-model="placement" allow-none />

      <label class="debug-control">
        <span class="debug-label">offset</span>
        <input type="number" min="0" max="40" v-model.number="offset">
      </label>

      <label class="debug-control">
        <span class="debug-label">arrowSize</span>
        <input type="number" min="0" max="20" v-model.number="arrowSize">
      </label>

      <label class="debug-control">
        <span class="debug-label">class</span>
        <select v-model="cardClass">
          <option v-for="variant in cardClasses" :key="variant.value" :value="variant.value">{{ variant.label }}</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">target → якорь</span>
        <input type="checkbox" v-model="useAnchor">
      </label>

      <label class="debug-control">
        <span class="debug-label">disabled</span>
        <input type="checkbox" v-model="disabled">
      </label>

      <button class="debug-btn" @click="openByPointer(trigger)">Открыть программно</button>
      <button class="debug-btn" @click="closeByPointer(trigger)">Закрыть</button>

      <span class="debug-hint" v-if="mode === 'string'">в режиме строки параметры ниже не участвуют</span>
    </div>

    <p class="debug-hint">
      значение: <span class="debug-value">{{ preview }}</span>
    </p>

    <div class="debug-stage center short">
      <div class="debug-row">
        <button class="debug-btn" ref="trigger" v-text-tooltip="value">цель с директивой</button>
        <div class="anchor" ref="anchor">якорь для target</div>
      </div>
    </div>

    <p class="debug-note">
      <b>target</b> меняет только точку привязки: слушатели остаются на элементе с директивой. Включи галочку —
      наводиться надо по-прежнему на «цель», а карточка появится у «якоря». Так делают, когда наводят на широкую
      строку, а показать надо у конкретной ячейки. Убери target — привязка вернётся к самому элементу.
    </p>

    <p class="debug-note">
      <b>disabled</b> есть в типе значения, но в docs/05-ui-kit.md не описан. Открой тултип программно и поставь
      галочку: он закроется на том же обновлении значения. Сними — вернётся, потому что директива всё ещё считает
      указатель внутри элемента (синтетического pointerleave не было).
    </p>

    <p class="debug-note">
      Параметры из значения — это снимок на момент показа. У уже открытого тултипа они применяются только потому,
      что при обновлении значения тултип пересоздаётся целиком; на тач-устройстве, где указателя «внутри» нет,
      открытый тултип на смену значения не отреагирует вообще — см. секции про useTooltip и тач.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { vTextTooltip } from '@/shared/ui/tooltip/textTooltip'
import type { TextTooltipValue } from '@/shared/uiKit/tooltip/types'
import { PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import PlacementSelect from '@/pages/debug/shared/PlacementSelect.vue'
import { cardClasses, type CardClass } from '../shared/cardClasses'
import { closeByPointer, openByPointer } from '../shared/pointerSimulation'

const mode = ref<'string' | 'object'>('object')
const text = ref('Подсказка из значения-объекта')
const placement = ref<PlacementWithModifiers | null>('top')
const offset = ref(7)
const arrowSize = ref(7)
const cardClass = ref<CardClass>('')
const useAnchor = ref(false)
const disabled = ref(false)

const trigger = useTemplateRef<HTMLElement>('trigger')
const anchor = useTemplateRef<HTMLElement>('anchor')

const value = computed<TextTooltipValue>(() => {
  if (mode.value === 'string') return text.value

  return {
    text: text.value,
    placement: placement.value ?? undefined,
    offset: offset.value,
    arrowSize: arrowSize.value,
    class: cardClass.value || undefined,
    target: useAnchor.value ? anchor.value : undefined,
    disabled: disabled.value,
  }
})

const preview = computed(() => {
  const current = value.value
  if (typeof current === 'string') return JSON.stringify(current)

  return JSON.stringify({ ...current, target: current.target ? '<div.anchor>' : undefined })
})

</script>


<style scoped lang="scss">
.anchor {
  border: 1px dashed var(--blue-color);
  border-radius: 4px;
  padding: 1.5em 1em;
  font-size: 12px;
  color: var(--blue-thin-color);
}
</style>
