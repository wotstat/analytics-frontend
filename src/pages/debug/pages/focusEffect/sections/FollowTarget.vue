<template>
  <DebugSection title="Слежение: скролл и смена размера" id="follow"
    description="Позиция пересчитывается каждый кадр, поэтому рамка обязана ехать за целью и при прокрутке, и когда цель меняет размер под подсветкой."
    source="src/shared/uiKit/focusEffect/RectEffect.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">держать подсветку</span>
        <input type="checkbox" v-model="pulse">
      </label>
      <span class="debug-hint">без этого эффект гаснет через {{ EFFECT_LIFETIME_MS }} мс и проверить скролл не выйдет</span>
    </div>

    <p class="debug-hint">Цель внутри прокручиваемого контейнера — прокрути его, потом всю страницу.</p>

    <div class="debug-stage scroll">
      <div class="scroll-inner">
        <button class="target" ref="scrollTarget" data-focus-label="в скролле"
          @click="fireOn(scrollTarget)">цель в контейнере</button>
      </div>
    </div>

    <p class="debug-note">
      Цель, уехавшая под край прокручиваемого контейнера, для эффекта всё ещё видима: рамка считается от вьюпорта и не
      знает про обрезку родителем — она останется висеть поверх обрезанной цели. То же ограничение, что и у поповеров.
    </p>

    <p class="debug-hint">Цель меняет размер под подсветкой — рамка должна следовать без отставания на кадр.</p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" min="60" max="600" v-model.number="width">
        <span class="debug-value">{{ width }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">высота</span>
        <input type="range" min="30" max="220" v-model.number="height">
        <span class="debug-value">{{ height }}px</span>
      </label>

      <button class="debug-btn" @click="fireOn(resizeTarget)">Подсветить</button>
    </div>

    <div class="debug-stage short">
      <button class="target" ref="resizeTarget" data-focus-label="ресайз"
        :style="{ width: `${width}px`, height: `${height}px` }" @click="fireOn(resizeTarget)">тяни ползунки</button>
    </div>

    <p class="debug-hint">Соседи сдвигают цель перекомпоновкой — эффект обязан переехать вместе с ней.</p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">соседей слева</span>
        <input type="range" min="0" max="6" v-model.number="siblings">
        <span class="debug-value">{{ siblings }}</span>
      </label>
      <button class="debug-btn" @click="fireOn(reflowTarget)">Подсветить</button>
    </div>

    <div class="debug-stage short">
      <div class="reflow">
        <span class="filler" v-for="i in siblings" :key="i">сосед {{ i }}</span>
        <button class="target" ref="reflowTarget" data-focus-label="перекомпоновка"
          @click="fireOn(reflowTarget)">цель</button>
      </div>
    </div>

    <p class="debug-note">
      Пальцем: прокрути страницу с включённым «держать подсветку» — рамка должна ехать за целью без рывков и не
      отставать на кадр. На инерционном скролле iOS отставание заметнее всего.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { showFocusEffect } from '@/shared/uiKit/focusEffect/focusEffect'
import { EFFECT_LIFETIME_MS } from '../shared/focusEffectControl'
import { useFocusPulse } from '../shared/useFocusPulse'

const scrollTarget = useTemplateRef<HTMLElement>('scrollTarget')
const resizeTarget = useTemplateRef<HTMLElement>('resizeTarget')
const reflowTarget = useTemplateRef<HTMLElement>('reflowTarget')

const width = ref(200)
const height = ref(60)
const siblings = ref(1)
const current = ref<HTMLElement | null>(null)

const { pulse } = useFocusPulse(current)

function fireOn(element: HTMLElement | null) {
  if (!element) return
  current.value = element
  showFocusEffect(element)
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
}

.scroll-inner {
  width: 180%;
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reflow {
  display: flex;
  align-items: center;
  gap: 0.75em;
  flex-wrap: wrap;

  .filler {
    font-size: 12px;
    color: #ffffff80;
    border: 1px dashed #ffffff25;
    border-radius: 4px;
    padding: 0.4em 0.6em;
  }
}
</style>
