<template>
  <DebugSection title="PopoverStyled: карточка со стрелкой и interactive" id="styled-card"
    description="Готовая карточка: фон, рамка, скругление и стрелка, которая сама встаёт напротив цели. С interactive: false карточка не перехватывает указатель — кнопка внутри не нажимается и текст не выделяется."
    source="src/shared/uiKit/popover/PopoverStyled.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">display</span>
        <input type="checkbox" v-model="display">
      </label>

      <PlacementSelect v-model="placement" label="placement" />

      <label class="debug-control">
        <span class="debug-label">arrowSize</span>
        <input type="range" min="0" max="20" v-model.number="arrowSize">
        <span class="debug-value">{{ arrowSize }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">arrowUsingMask</span>
        <input type="checkbox" v-model="arrowUsingMask">
      </label>

      <label class="debug-control">
        <span class="debug-label">interactive</span>
        <input type="checkbox" v-model="interactive">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">offset авто</span>
        <input type="checkbox" v-model="autoOffset">
      </label>

      <label class="debug-control" v-if="!autoOffset">
        <span class="debug-label">offset</span>
        <input type="range" min="0" max="40" v-model.number="offset">
        <span class="debug-value">{{ offset }}</span>
      </label>

      <span class="debug-hint" v-else>
        offset не передан → <span class="debug-value">{{ arrowSize ? arrowSize + 3 : 7 }}</span>
        (arrowSize + 3, а без стрелки — 7)
      </span>

      <label class="debug-control">
        <span class="debug-label">полупрозрачный фон через styles</span>
        <input type="checkbox" v-model="customBackground">
      </label>

      <label class="debug-control">
        <span class="debug-label">широкое содержимое</span>
        <input type="checkbox" v-model="wide">
      </label>
    </div>

    <div class="debug-stage center tall">
      <button class="debug-btn" ref="target" @click="display = !display">цель</button>
      <button class="debug-btn under" @click="underClicks++">кнопка под карточкой — {{ underClicks }}</button>
    </div>

    <PopoverStyled :target="target" :display="display" :placement="placement ?? 'top'" :arrow-size="arrowSize"
      :arrow-using-mask="arrowUsingMask" :interactive="interactive" :offset="autoOffset ? undefined : offset"
      :styles="styles">
      <div class="card-body" :class="{ wide }">
        <div class="title">PopoverStyled</div>
        <div class="hint">interactive: {{ interactive }}</div>
        <button class="card-btn" @click="cardClicks++">нажатий по кнопке в карточке: {{ cardClicks }}</button>
        <div class="hint">и этот текст попробуй выделить мышкой</div>
      </div>
    </PopoverStyled>

    <p class="debug-hint">
      нажатий внутри карточки: <span class="debug-value">{{ cardClicks }}</span>,
      по кнопке под карточкой: <span class="debug-value">{{ underClicks }}</span>
    </p>

    <p class="debug-note">
      Про <b>interactive</b>: с <span class="debug-value">true</span> кнопка в карточке считает нажатия и текст
      выделяется. С <span class="debug-value">false</span> карточка целиком становится
      <span class="debug-value">pointer-events: none</span> — счётчик внутри стоит на месте, зато нажатия проходят
      сквозь карточку на кнопку под ней (наведи карточку на неё через placement и посчитай). Так делают тултипы:
      им нельзя перехватывать мышь.
    </p>

    <p class="debug-note">
      Про <b>arrowSize</b>: 0 полностью выключает стрелку (и меняет offset по умолчанию с arrowSize+3 на 7).
      <span class="debug-value">arrowUsingMask</span> вырезает уголок из фона карточки вместо того, чтобы рисовать
      стрелку поверх — разница видна только на полупрозрачном фоне: включи «полупрозрачный фон через styles» и
      потыкай галочку, на стыке стрелки и карточки не должно быть полосы двойного затемнения.
    </p>

    <p class="debug-note">
      Проп <span class="debug-value">styles</span> кладёт inline-стили на контейнер поповера, поэтому через него удобно
      передавать CSS-переменные (<span class="debug-value">--popover-background-color</span>,
      <span class="debug-value">--popover-border-color</span>) — они наследуются в карточку. А вот проп
      <span class="debug-value">class</span> из scoped-стилей секции не покрасить: карточка живёт вне разметки
      страницы, и селектор со scope-атрибутом до неё не дотянется — нужен глобальный класс. Содержимое слота при этом
      scoped-стилями стилизуется нормально, чем эта страница и пользуется.
    </p>

    <p class="debug-note">
      Пальцем: с <span class="debug-value">interactive: false</span> тап по карточке должен попадать в то, что под ней;
      с <span class="debug-value">true</span> — в саму карточку. Ещё проверь, что скролл страницы пальцем поверх
      неинтерактивной карточки работает (палец её «не видит»).
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'
import { PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import PlacementSelect from '../shared/PlacementSelect.vue'

const target = useTemplateRef<HTMLElement>('target')

const display = ref(true)
const placement = ref<PlacementWithModifiers | null>('top')
const arrowSize = ref(7)
const arrowUsingMask = ref(false)
const interactive = ref(true)
const autoOffset = ref(true)
const offset = ref(10)
const customBackground = ref(false)
const wide = ref(false)
const cardClicks = ref(0)
const underClicks = ref(0)

const styles = computed(() => customBackground.value
  ? { '--popover-background-color': 'rgba(60, 40, 90, 0.75)', '--popover-border-color': '#8a5ad0' }
  : undefined)

</script>


<style scoped lang="scss">
.under {
  position: absolute;
  left: 1em;
  bottom: 1em;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  padding: 0.6em 0.7em;
  font-size: 13px;
  line-height: 1.4;
  max-width: 260px;

  &.wide {
    width: 320px;
    max-width: none;
  }

  .title {
    font-weight: 600;
  }

  .hint {
    font-size: 11px;
    color: #ffffff80;
  }

  // Кнопка внутри поповера: классы .debug-* тут не работают, стилизуем сами.
  .card-btn {
    background: #ffffff14;
    border: 1px solid #ffffff35;
    border-radius: 4px;
    color: inherit;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    padding: 0.3em 0.6em;

    &:hover {
      background: #ffffff26;
    }
  }
}
</style>
