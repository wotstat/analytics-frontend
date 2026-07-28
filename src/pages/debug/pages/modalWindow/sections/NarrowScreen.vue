<template>
  <DebugSection title="Узкий экран" id="narrow-screen"
    description="Мобильная раскладка держится на настоящем @media (max-width: 700px) у .modal-window, а не на ширине контейнера — сжимай окно браузера целиком, а не эту страницу."
    source="src/shared/ui/modalWindow/ModalWindow.vue">

    <table class="debug-table">
      <thead>
        <tr>
          <th></th>
          <th>значение</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>window.innerWidth</th>
          <td class="debug-value">{{ width }}px</td>
        </tr>
        <tr>
          <th>порог в коде</th>
          <td class="debug-value">700px</td>
        </tr>
        <tr>
          <th>сейчас мобильная раскладка</th>
          <td :class="width <= 700 ? 'true' : 'false'">{{ width <= 700 }}</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-row">
      <button class="debug-btn" @click="display = true">Открыть окно</button>
    </div>

    <ModalWindow title="Проверка узкого экрана" :display="display" @close="display = false">
      <p v-for="n in 20" :key="n">
        Строка {{ n }}. На ширине ≤700px модалка становится на всю ширину экрана, теряет нижние скругления и
        прижимается к низу — margin-top: auto вместо центрирования по вертикали.
      </p>
    </ModalWindow>

    <p class="debug-note">
      Ничего не мешает открыть модалку и просто сжать окно браузера прямо сейчас, пока она открыта — раскладка
      обязана перестроиться на лету, порог реактивный (media query), а не однократный расчёт при открытии.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'

const display = ref(false)
const width = ref(window.innerWidth)

useEventListener(window, 'resize', () => width.value = window.innerWidth)
</script>
