<template>
  <DebugSection title="Геометрия цели" id="geometry"
    description="Рамка эффекта обязана повторять размер и скругления цели, а не приблизительно её обводить. Скругление берётся из вычисленного стиля цели."
    source="src/shared/uiKit/focusEffect/RectEffect.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">держать подсветку</span>
        <input type="checkbox" v-model="pulse">
      </label>

      <button class="debug-btn" @click="fireAll">Подсветить все разом</button>
      <button class="debug-btn" @click="clearFocusEffects">Снять всё</button>
      <span class="debug-hint">активных: <span class="debug-value">{{ activeEffectsCount }}</span></span>
    </div>

    <p class="debug-hint">
      Наведи на любую фигуру — подсветится она. Тумблер выше держит подсветку последней наведённой, иначе она гаснет
      через {{ EFFECT_LIFETIME_MS }} мс.
    </p>

    <div class="debug-stage">
      <div class="shapes">
        <button class="shape wide" ref="wide" data-focus-label="широкий" @pointerenter="focus(wide)">широкий блок</button>
        <button class="shape narrow" ref="narrow" data-focus-label="узкий"
          @pointerenter="focus(narrow)">узкий</button>
        <button class="shape round" ref="round" data-focus-label="круг" @pointerenter="focus(round)">круг</button>
        <button class="shape pill" ref="pill" data-focus-label="таблетка" @pointerenter="focus(pill)">таблетка</button>
        <button class="shape tall" ref="tall" data-focus-label="высокий" @pointerenter="focus(tall)">высокий</button>
        <span class="shape inline" ref="inline" data-focus-label="строчный"
          @pointerenter="focus(inline)">строчный span</span>
      </div>
    </div>

    <p class="debug-note">
      Скругление читается **один раз** при создании эффекта (`element.computedStyleMap()` в момент setup), поэтому если
      поменять цели `border-radius` уже во время подсветки, рамка останется с прежним скруглением до следующего вызова.
      Проверяется тумблером ниже.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">скругление цели</span>
        <input type="range" min="0" max="40" v-model.number="radius">
        <span class="debug-value">{{ radius }}px</span>
      </label>
      <button class="debug-btn" @click="focus(radiusTarget)">Подсветить</button>
    </div>

    <div class="debug-stage center short">
      <button class="shape radius-demo" ref="radiusTarget" data-focus-label="скругление"
        :style="{ borderRadius: `${radius}px` }" @click="focus(radiusTarget)">
        меняй ползунок во время подсветки
      </button>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { showFocusEffect } from '@/shared/uiKit/focusEffect/focusEffect'
import { activeEffectsCount, clearFocusEffects, EFFECT_LIFETIME_MS } from '../shared/focusEffectControl'
import { useFocusPulse } from '../shared/useFocusPulse'

const wide = useTemplateRef<HTMLElement>('wide')
const narrow = useTemplateRef<HTMLElement>('narrow')
const round = useTemplateRef<HTMLElement>('round')
const pill = useTemplateRef<HTMLElement>('pill')
const tall = useTemplateRef<HTMLElement>('tall')
const inline = useTemplateRef<HTMLElement>('inline')
const radiusTarget = useTemplateRef<HTMLElement>('radiusTarget')

const radius = ref(8)
const hovered = ref<HTMLElement | null>(null)

const { pulse } = useFocusPulse(hovered)

function focus(element: HTMLElement | null) {
  if (!element) return
  hovered.value = element
  showFocusEffect(element)
}

function fireAll() {
  for (const target of [wide, narrow, round, pill, tall, inline]) {
    if (target.value) showFocusEffect(target.value)
  }
}

</script>


<style scoped lang="scss">
.shapes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1em;
}

.shape {
  background: #ffffff14;
  border: 1px solid #ffffff30;
  border-radius: 8px;
  color: inherit;
  font-family: inherit;
  font-size: 13px;
  padding: 0.5em 0.9em;
  cursor: pointer;

  &.wide {
    width: 260px;
  }

  &.narrow {
    width: 70px;
    overflow: hidden;
  }

  &.round {
    width: 90px;
    height: 90px;
    border-radius: 50%;
  }

  &.pill {
    border-radius: 999px;
  }

  &.tall {
    height: 120px;
  }

  &.inline {
    display: inline;
    border-radius: 3px;
  }

  &.radius-demo {
    width: 240px;
    height: 80px;
  }
}
</style>
