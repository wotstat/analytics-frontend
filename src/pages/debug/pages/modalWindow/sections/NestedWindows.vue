<template>
  <DebugSection title="Два окна подряд и вложенность" id="nested"
    description="Второе окно поверх первого делит общий счётчик блокировки скролла, но у каждого свой независимый Escape. Закрытие одного не снимает блокировку, пока открыто другое."
    source="src/shared/ui/modalWindow/ModalWindow.vue">

    <div class="debug-row">
      <button class="debug-btn" :class="{ active: firstOpen }" @click="firstOpen = true">Открыть первое</button>
      <button class="debug-btn" :class="{ active: secondOpen }" @click="secondOpen = true" :disabled="!firstOpen">
        Открыть второе поверх
      </button>
      <button class="debug-btn" @click="firstOpen = false">Закрыть только первое</button>
      <button class="debug-btn" @click="secondOpen = false">Закрыть только второе</button>
    </div>

    <ModalWindow title="Первое окно" :display="firstOpen" @close="firstOpen = false">
      <p>Это первое окно. Открой поверх него второе и понажимай Escape.</p>
    </ModalWindow>

    <ModalWindow title="Второе окно (поверх)" :display="secondOpen" @close="secondOpen = false">
      <p>Это второе окно, открытое поверх первого — тот же z-index: 1000, порядок в DOM решает, кто сверху.</p>
    </ModalWindow>

    <table class="debug-table">
      <thead>
        <tr>
          <th>состояние</th>
          <th>значение</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>первое открыто</th>
          <td :class="firstOpen ? 'true' : 'false'">{{ firstOpen }}</td>
        </tr>
        <tr>
          <th>второе открыто</th>
          <td :class="secondOpen ? 'true' : 'false'">{{ secondOpen }}</td>
        </tr>
        <tr>
          <th>html.no-scroll</th>
          <td :class="htmlLocked ? 'true' : 'false'">{{ htmlLocked }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Оба окна навешивают <span class="debug-value">useNoScroll()</span> независимо — счётчик считает оба, поэтому
      «html.no-scroll» остаётся true, пока открыто хотя бы одно. Закрой их по одному кнопками выше и следи за
      таблицей — блокировка снимется только когда оба false.
    </p>

    <p class="debug-note">
      Нажми Escape, когда открыты оба: у каждого смонтированного ModalWindowContent — свой независимый
      <span class="debug-value">onKeyDown('Escape', ...)</span>, и общего «кто сейчас верхний» компонент не
      отслеживает. Одно нажатие Escape закроет сразу оба окна, а не только верхнее — это расхождение с обычным
      поведением стека модалок и нигде не задокументировано.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
import { useClassState } from '../shared/useClassState'

const firstOpen = ref(false)
const secondOpen = ref(false)

const htmlLocked = useClassState(document.documentElement, 'no-scroll')
</script>
