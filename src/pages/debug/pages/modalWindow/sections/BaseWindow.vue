<template>
  <DebugSection title="Базовое окно" id="base"
    description="ModalWindow — Teleport в body + Transition + ModalWindowContent. Пропсы, слоты и порядок событий open → before-open → close → after-close сверены по коду."
    source="src/shared/ui/modalWindow/ModalWindow.vue">

    <table class="debug-table">
      <thead>
        <tr>
          <th>компонент</th>
          <th>пропсы</th>
          <th>события</th>
          <th>слоты</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>ModalWindow</th>
          <td>title, display, marginBlockStart?</td>
          <td>close, before-open, after-close</td>
          <td>default, controls, header-content, footer-content (форвардит в ModalWindowContent)</td>
        </tr>
        <tr>
          <th>ModalWindowContent</th>
          <td>title, hideCloseButton?</td>
          <td>close</td>
          <td>default, controls, header-content, footer-content</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      <span class="debug-value">hideCloseButton</span> есть только у ModalWindowContent — ModalWindow его не
      прокидывает и вообще не знает о таком пропе. Через публичный ModalWindow крестик спрятать нельзя, только
      напрямую через ModalWindowContent (демо ниже).
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">title</span>
        <input type="text" v-model="title">
      </label>
      <label class="debug-control">
        <span class="debug-label">marginBlockStart</span>
        <input type="text" v-model="marginBlockStart" placeholder="напр. 35px">
      </label>
      <button class="debug-btn" @click="open">Открыть ModalWindow</button>
    </div>

    <ModalWindow :title="title || 'Без заголовка'" :display="display" :margin-block-start="marginBlockStart || undefined"
      @close="close" @before-open="push('before-open')" @after-close="push('after-close')">
      <template #controls>
        <span class="debug-value controls-marker">controls</span>
      </template>

      <template #header-content>
        <p class="debug-hint">header-content: строка под заголовком, над скроллом</p>
      </template>

      <p v-for="n in 25" :key="n">Строка содержимого {{ n }} — default slot, скроллится вместе с main.</p>

      <template #footer-content>
        <p class="debug-hint">footer-content: строка над футером, вне скролла</p>
      </template>
    </ModalWindow>

    <EventLog :entries="entries" @clear="clear" title="Жизненный цикл: open → before-open → close → after-close"
      empty="Нажми «Открыть ModalWindow»" />

    <p class="debug-note">
      <span class="debug-value">before-open</span> стреляет в момент начала transition-появления,
      <span class="debug-value">after-close</span> — только когда transition-исчезновение (0.3s) уже закончилось и
      ModalWindowContent размонтирован. Между своим <span class="debug-value">close</span> (по клику/Escape) и
      реальным исчезновением из DOM проходят эти же 0.3s — сравни время в логе.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <input type="checkbox" v-model="hideCloseButton">
        <span class="debug-label">hideCloseButton</span>
      </label>
      <button class="debug-btn" @click="directDisplay = true">Открыть ModalWindowContent напрямую</button>
    </div>

    <ModalWindowContent v-if="directDisplay" title="В обход ModalWindow" :hide-close-button="hideCloseButton"
      @close="directDisplay = false">
      <p>
        Этот экземпляр — ModalWindowContent без Teleport и без Transition, вызван прямо со страницы. Крестик реально
        подчиняется чекбоксу выше, в отличие от варианта через ModalWindow.
      </p>
    </ModalWindowContent>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
import ModalWindowContent from '@/shared/ui/modalWindow/ModalWindowContent.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const title = ref('Заголовок окна')
const marginBlockStart = ref('')
const display = ref(false)
const hideCloseButton = ref(false)
const directDisplay = ref(false)

const { entries, push, clear } = useEventLog()

function open() {
  display.value = true
  push('open (клик по кнопке)')
}

function close() {
  push('close (получено событие @close)')
  display.value = false
}
</script>


<style scoped lang="scss">
.controls-marker {
  padding: 0 0.4em;
}
</style>
