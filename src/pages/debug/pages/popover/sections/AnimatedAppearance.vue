<template>
  <DebugSection title="PopoverAnimated: появление и скрытие" id="animated"
    description="Появление не должно мигать в левом верхнем углу: карточка ждёт первого кадра с посчитанной позицией и только потом проявляется. Скрытие должно доигрывать до конца — жми «мигнуть» и смотри на уход."
    source="src/shared/uiKit/popover/PopoverAnimated.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">display (PopoverStyled)</span>
        <input type="checkbox" v-model="display">
      </label>

      <label class="debug-control">
        <span class="debug-label">enterDuration</span>
        <input type="range" min="0" max="1200" step="50" v-model.number="enterDuration">
        <span class="debug-value">{{ enterDuration }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">exitDuration</span>
        <input type="range" min="0" max="1200" step="50" v-model.number="exitDuration">
        <span class="debug-value">{{ exitDuration }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">сдвиг анимации</span>
        <input type="range" min="0" max="40" v-model.number="animationOffset">
        <span class="debug-value">{{ animationOffset }}px</span>
      </label>

      <button class="debug-btn" @click="blinkStyled">Мигнуть</button>
    </div>

    <div class="debug-stage center short">
      <button class="debug-btn" ref="target" @click="display = !display">цель PopoverStyled</button>
    </div>

    <PopoverStyled :target="target" :display="display" :placement="['top', 'bottom']" :arrow-size="7"
      :enter-duration="enterDuration" :exit-duration="exitDuration"
      :styles="{ '--animation-transition-offset': `${animationOffset}px` }">
      <div class="card-body">
        <div>enter {{ enterDuration }} мс / exit {{ exitDuration }} мс</div>
        <div class="hint">карточка выезжает со стороны стрелки</div>
      </div>
    </PopoverStyled>

    <p class="debug-hint">
      Ниже — сырой <span class="debug-value">PopoverAnimated</span>: он не рисует ни карточку, ни анимацию, а только
      отдаёт в слот классы перехода. Список классов написан прямо в карточке — видно, как он меняется по кадрам.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">display (PopoverAnimated)</span>
        <input type="checkbox" v-model="rawDisplay">
      </label>

      <label class="debug-control">
        <span class="debug-label">длительность CSS</span>
        <input type="range" min="100" max="2000" step="100" v-model.number="rawDuration">
        <span class="debug-value">{{ rawDuration }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">оборвать: duration = 60</span>
        <input type="checkbox" v-model="truncate">
      </label>

      <button class="debug-btn" @click="blinkRaw">Мигнуть</button>
    </div>

    <div class="debug-stage center short">
      <button class="debug-btn" ref="rawTarget" @click="rawDisplay = !rawDisplay">цель PopoverAnimated</button>
    </div>

    <PopoverAnimated :target="rawTarget" :display="rawDisplay" :offset="8" :placement="['top', 'bottom']"
      :duration="truncate ? 60 : rawDuration" v-slot="{ arrow, transitionClass }">
      <div class="anim-card" :class="transitionClass" :style="{ '--duration': `${rawDuration}ms` }">
        <div>свои классы перехода</div>
        <div class="value">классы: {{ transitionClass.join(' ') || '—' }}</div>
        <div class="value">стрелка: {{ arrow.direction ?? '—' }}</div>
      </div>
    </PopoverAnimated>

    <p class="debug-note">
      Порядок классов такой: <span class="debug-value">v-prepare</span> (позиция ещё не посчитана, карточка спрятана),
      затем <span class="debug-value">v-enter-from</span> → <span class="debug-value">v-enter-active v-enter-to</span>,
      на скрытии — <span class="debug-value">v-leave-active v-leave-to</span>. Ключевое: v-prepare снимается только
      после первого кадра с посчитанным placement, иначе карточка успевала мигнуть в точке 0,0. Если поймаешь такое
      мигание — это регрессия.
    </p>

    <p class="debug-note">
      Проп <span class="debug-value">duration</span> — это не длительность анимации, а срок, на который узел остаётся
      в DOM после скрытия. Он обязан быть не меньше CSS-перехода: включи «оборвать» и нажми «мигнуть» — карточка
      исчезнет мгновенно, не доиграв уход. В <span class="debug-value">PopoverStyled</span> это уже сделано за тебя:
      duration = max(enterDuration, exitDuration).
    </p>

    <p class="debug-note">
      Пальцем: быстро потыкай по цели — повторное открытие во время скрытия должно перехватываться на полпути
      (карточка возвращается из текущего состояния, а не прыгает), и наоборот. Ещё проверь при
      <span class="debug-value">enterDuration = 0</span>, что появление просто мгновенное, без мигания.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { onUnmounted, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PopoverAnimated from '@/shared/uiKit/popover/PopoverAnimated.vue'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'

const target = useTemplateRef<HTMLElement>('target')
const rawTarget = useTemplateRef<HTMLElement>('rawTarget')

const display = ref(false)
const enterDuration = ref(200)
const exitDuration = ref(100)
const animationOffset = ref(3)

const rawDisplay = ref(false)
const rawDuration = ref(600)
const truncate = ref(false)

type TimeoutHandle = ReturnType<typeof setTimeout> | null
let styledHandle: TimeoutHandle = null
let rawHandle: TimeoutHandle = null

function blinkStyled() {
  if (styledHandle) clearTimeout(styledHandle)
  display.value = true
  styledHandle = setTimeout(() => display.value = false, enterDuration.value + 500)
}

function blinkRaw() {
  if (rawHandle) clearTimeout(rawHandle)
  rawDisplay.value = true
  rawHandle = setTimeout(() => rawDisplay.value = false, rawDuration.value + 500)
}

onUnmounted(() => {
  if (styledHandle) clearTimeout(styledHandle)
  if (rawHandle) clearTimeout(rawHandle)
})

</script>


<style scoped lang="scss">
.card-body {
  padding: 0.5em 0.7em;
  font-size: 13px;
  line-height: 1.4;

  .hint {
    font-size: 11px;
    color: #ffffff80;
  }
}

.anim-card {
  background-color: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
  color: #f6f6f6;
  font-size: 13px;
  line-height: 1.4;
  padding: 0.5em 0.7em;
  max-width: 280px;

  .value {
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 11px;
    color: #ffffffb0;
  }

  &.v-prepare {
    visibility: hidden;
    opacity: 0;
  }

  &.v-enter-active,
  &.v-leave-active {
    transition: opacity var(--duration) ease, transform var(--duration) ease;
  }

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.94);
  }
}
</style>
