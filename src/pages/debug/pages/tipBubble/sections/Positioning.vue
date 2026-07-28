<template>
  <DebugSection title="Позиционирование" id="positioning"
    description="Проектная обёртка shared/ui/tipBubble — с дефолтами сайта (pagePadding = --content-page-margin). Смотри, куда уезжает бабл у краёв сцены, в скроллируемом контейнере и с текстом, который не влезает."
    source="src/shared/ui/tipBubble/TipBubbleText.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">direction</span>
        <select v-model="direction">
          <option value="auto">auto</option>
          <option value="left">left</option>
          <option value="right">right</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">текст</span>
        <select v-model="textKind">
          <option value="short">короткий</option>
          <option value="long">длинный</option>
          <option value="word">одно длинное слово</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">показать</span>
        <input type="checkbox" v-model="display">
      </label>

      <button class="debug-btn" @click="remount">Пересоздать</button>
      <button class="debug-btn" @click="reset">Сбросить хранилище</button>
    </div>

    <p class="debug-hint">
      Девять целей по краям сцены и одинаковые опции на всех: у крайних баблов должно хватить ума не уехать за
      границу страницы.
    </p>

    <div class="debug-stage edges" :key="generation">
      <div class="cell" v-for="index in 9" :key="index">
        <TipBubbleText :bubbleKey="`debug-position-${generation}-${index}`" :direction="direction" :text="text"
          :display="display" />
        <span class="debug-value">{{ index }}</span>
      </div>
    </div>

    <p class="debug-hint">Тот же бабл внутри скроллируемого контейнера — прокрути его и всю страницу.</p>

    <div class="debug-stage scroll" :key="`scroll-${generation}`">
      <div class="scroll-inner">
        <div class="cell">
          <TipBubbleText :bubbleKey="`debug-position-${generation}-scroll`" :direction="direction" :text="text"
            :display="display" />
          <span class="debug-value">цель в скролле</span>
        </div>
      </div>
    </div>

    <p class="debug-note">
      Бабл считает своё место от края страницы через <span class="debug-value">pagePadding</span>, а не от контейнера,
      в котором лежит. Внутри скроллируемого блока это заметно: цель уезжает под край контейнера, а бабл продолжает
      ориентироваться на страницу.
    </p>

    <p class="debug-note">
      Пальцем: проверь, что бабл не перекрывает саму цель и не вылезает за край экрана в обеих ориентациях, и что при
      прокрутке страницы он едет вместе с целью.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'
import { computed, ref } from 'vue'
import { resetBubbleKeys } from '../shared/storage'

const direction = ref<'auto' | 'left' | 'right'>('auto')
const textKind = ref<'short' | 'long' | 'word'>('short')
const display = ref(true)
const generation = ref(0)

const text = computed(() => {
  if (textKind.value === 'long') return 'Длинная подсказка, которая обязана переноситься по словам и не растягивать сцену по горизонтали ни при какой ширине экрана'
  if (textKind.value === 'word') return 'Совершенно-непереносимое-слово-без-единого-пробела-внутри-себя'
  return 'Подсказка'
})

function remount() {
  generation.value += 1
}

function reset() {
  const keys = Array.from({ length: 9 }, (_, i) => `debug-position-${generation.value}-${i + 1}`)
  resetBubbleKeys(...keys, `debug-position-${generation.value}-scroll`)
  remount()
}

</script>


<style scoped lang="scss">
.cell {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.3em 0.5em;
  border: 1px solid #ffffff20;
  border-radius: 4px;
}

.scroll-inner {
  width: 160%;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
