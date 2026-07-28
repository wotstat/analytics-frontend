<template>
  <DebugSection title="PopupWindow — независимый попап (не часть ModalWindow)" id="popup-window-legacy"
    description="Отдельный старый компонент со своей вёрсткой и своей блокировкой скролла — не переиспользует ModalWindowContent, CloseButton или useNoScroll. Показан для сравнения, дорабатывать нельзя."
    source="src/shared/ui/components/PopupWindow.vue">

    <table class="debug-table">
      <thead>
        <tr>
          <th>чем отличается от ModalWindow</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>крестик</th>
          <td>инлайновый svg-путь в самом файле, а не CloseButton/CircleButton</td>
        </tr>
        <tr>
          <th>блокировка скролла</th>
          <td>сам вешает класс no-scroll на document.body в onMounted/onUnmounted — без счётчика</td>
        </tr>
        <tr>
          <th>overflow: hidden для этого класса</th>
          <td>
            в самом PopupWindow.vue не определён — глобально приезжает из &lt;style&gt; (не scoped) в
            pages/infographics/settings/Settings.vue
          </td>
        </tr>
        <tr>
          <th>слоты</th>
          <td>только заголовок (title) и один default — нет controls/header-content/footer-content</td>
        </tr>
        <tr>
          <th>Escape</th>
          <td>свой document.addEventListener('keydown', ...), а не onKeyDown из vueuse</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-row">
      <button class="debug-btn" :class="{ active: firstOpen }" @click="firstOpen = true">Открыть A</button>
      <button class="debug-btn" :class="{ active: secondOpen }" @click="secondOpen = true" :disabled="!firstOpen">
        Открыть B поверх A
      </button>
      <button class="debug-btn" @click="firstOpen = false">Закрыть только A</button>
      <button class="debug-btn" @click="secondOpen = false">Закрыть только B</button>
    </div>

    <PopupWindow v-if="firstOpen" title="Попап A" @close="firstOpen = false">
      <p>Содержимое попапа A.</p>
    </PopupWindow>

    <PopupWindow v-if="secondOpen" title="Попап B (поверх A)" @close="secondOpen = false">
      <p>Содержимое попапа B.</p>
    </PopupWindow>

    <table class="debug-table">
      <thead>
        <tr>
          <th>состояние</th>
          <th>значение</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>A открыт</th>
          <td :class="firstOpen ? 'true' : 'false'">{{ firstOpen }}</td>
        </tr>
        <tr>
          <th>B открыт</th>
          <td :class="secondOpen ? 'true' : 'false'">{{ secondOpen }}</td>
        </tr>
        <tr>
          <th>body.no-scroll (класс)</th>
          <td :class="bodyLocked ? 'true' : 'false'">{{ bodyLocked }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Открой оба и закрой только A — по коду это force-remove без счётчика, поэтому
      <span class="debug-value">body.no-scroll</span> в таблице выше должен пропасть сразу, хотя B ещё открыт. У
      ModalWindow (секция «Два окна подряд и вложенность») так не бывает — там общий счётчик.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PopupWindow from '@/shared/ui/components/PopupWindow.vue'
import { useClassState } from '../shared/useClassState'

const firstOpen = ref(false)
const secondOpen = ref(false)

const bodyLocked = useClassState(document.body, 'no-scroll')
</script>
