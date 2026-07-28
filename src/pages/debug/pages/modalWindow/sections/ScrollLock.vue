<template>
  <DebugSection title="Блокировка скролла страницы" id="scroll-lock"
    description="useNoScroll вешает класс no-scroll на <html> через счётчик открытых окон. Открой окно — страница не должна скроллиться, а после закрытия скролл обязан вернуться без прыжка."
    source="src/shared/ui/noScroll/noScroll.ts">

    <div class="debug-row">
      <button class="debug-btn" @click="openScrollDemo">Открыть модалку (с длинным содержимым)</button>
      <span class="debug-hint">…и попробуй прокрутить страницу колесом мыши под ней.</span>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>что проверяем</th>
          <th>значение</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>html.no-scroll</th>
          <td :class="htmlLocked ? 'true' : 'false'">{{ htmlLocked }}</td>
        </tr>
        <tr>
          <th>html.scrollbar-gutter</th>
          <td :class="gutterActive ? 'true' : 'false'">{{ gutterActive }}</td>
        </tr>
        <tr>
          <th>window.scrollY сейчас</th>
          <td class="debug-value">{{ scrollY }}</td>
        </tr>
        <tr>
          <th>scrollY при открытии</th>
          <td class="debug-value">{{ scrollYAtOpen ?? '—' }}</td>
        </tr>
        <tr>
          <th>scrollY при последнем закрытии</th>
          <td class="debug-value">{{ scrollYAtClose ?? '—' }}</td>
        </tr>
        <tr>
          <th>прыжок при закрытии</th>
          <td :class="jump === 0 ? 'true' : 'false'">{{ jump ?? '—' }}px</td>
        </tr>
      </tbody>
    </table>

    <ModalWindow title="Длинное содержимое для проверки блокировки" :display="display" @close="closeScrollDemo">
      <p v-for="n in 40" :key="n">Строка {{ n }} — эта модалка сама скроллится внутри, пока html заблокирован снаружи.
      </p>
    </ModalWindow>

    <div class="debug-col">
      <p class="debug-hint" v-for="n in 30" :key="n">
        Наполнитель страницы, строка {{ n }}. Прокрути колесом, пока модалка открыта — ничего не должно шевелиться.
      </p>
    </div>

    <p class="debug-note">
      iOS Safari: <span class="debug-value">overflow: hidden</span> на <span class="debug-value">html</span> не
      всегда останавливает резиновый скролл (rubber-banding) страницы под модалкой на тач-жесте — известная
      особенность WebKit. Проверяй пальцем на настоящем устройстве, не только в этом окне браузера.
    </p>

    <p class="debug-note">
      Класс вешается на <span class="debug-value">document.documentElement</span> (тег
      <span class="debug-value">&lt;html&gt;</span>), а не на <span class="debug-value">&lt;body&gt;</span> — в
      отличие от старого <span class="debug-value">PopupWindow.vue</span> (см. секцию в конце страницы). Счётчик
      общий на всю страницу: пока где-то ещё открыто хотя бы одно окно на <span class="debug-value">useNoScroll</span>,
      класс не снимется — проверь это в секции «Два окна подряд и вложенность».
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
import { useClassState } from '../shared/useClassState'

const display = ref(false)
const scrollY = ref(window.scrollY)
const scrollYAtOpen = ref<number | null>(null)
const scrollYAtClose = ref<number | null>(null)
const jump = ref<number | null>(null)

const htmlLocked = useClassState(document.documentElement, 'no-scroll')
const gutterActive = useClassState(document.documentElement, 'scrollbar-gutter')

useEventListener(window, 'scroll', () => scrollY.value = window.scrollY, { passive: true })

function openScrollDemo() {
  scrollYAtOpen.value = window.scrollY
  display.value = true
}

function closeScrollDemo() {
  display.value = false
  scrollYAtClose.value = window.scrollY
  jump.value = scrollYAtOpen.value === null ? null : scrollYAtClose.value - scrollYAtOpen.value
}
</script>
