<template>
  <DebugSection title="Содержимое" id="content"
    description="Модалка обязана скроллиться сама по вертикали, а не растягивать страницу. У широкой таблицы и картинки — свой горизонтальный скролл внутри main, это не настройка компонента, а побочный эффект CSS."
    source="src/shared/ui/modalWindow/ModalWindowContent.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">содержимое</span>
        <select v-model="mode">
          <option value="short">короткое</option>
          <option value="long">очень длинное</option>
          <option value="table">широкая таблица</option>
          <option value="image">картинка шире окна</option>
        </select>
      </label>
      <label class="debug-control" v-if="mode === 'image'">
        <input type="checkbox" v-model="constrainImage">
        <span class="debug-label">max-width: 100% на картинке (руками, не от компонента)</span>
      </label>
      <button class="debug-btn" @click="display = true">Открыть</button>
    </div>

    <ModalWindow title="Содержимое" :display="display" @close="display = false">
      <p v-if="mode === 'short'">
        Одна короткая строка. Окно не обязано растягиваться под контент — высота фиксированная (900px, до
        calc(100dvh - 30px)).
      </p>

      <template v-else-if="mode === 'long'">
        <p v-for="n in 120" :key="n">Строка {{ n }} длинного содержимого. Скроллбар обязан появиться внутри модалки.</p>
      </template>

      <table class="debug-table wide" v-else-if="mode === 'table'">
        <thead>
          <tr>
            <th v-for="n in 20" :key="n">Колонка {{ n }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in 8" :key="row">
            <td v-for="n in 20" :key="n">{{ row }}.{{ n }}</td>
          </tr>
        </tbody>
      </table>

      <svg v-else-if="mode === 'image'" viewBox="0 0 1600 500" class="fake-image"
        :class="{ constrained: constrainImage }" xmlns="http://www.w3.org/2000/svg">
        <rect width="1600" height="500" fill="#3b3b3b" />
        <text x="800" y="260" text-anchor="middle" fill="#ffffff80" font-size="42">1600 × 500 — шире окна</text>
      </svg>
    </ModalWindow>

    <p class="debug-note">
      У <span class="debug-value">main</span> в ModalWindowContent задан только
      <span class="debug-value">overflow-y: scroll</span>. По спецификации CSS, раз одна ось overflow не
      <span class="debug-value">visible</span>, вторая (<span class="debug-value">overflow-x</span>) автоматически
      становится <span class="debug-value">auto</span> — поэтому широкая таблица и нестилизованная картинка
      скроллятся сами по себе внутри окна, а не ломают вёрстку карточки.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'

const mode = ref<'short' | 'long' | 'table' | 'image'>('short')
const constrainImage = ref(false)
const display = ref(false)
</script>


<style scoped lang="scss">
.debug-table.wide {

  th,
  td {
    white-space: nowrap;
  }
}

.fake-image {
  display: block;
  width: 1600px;
  max-width: none;
  height: auto;

  &.constrained {
    width: 100%;
    max-width: 100%;
  }
}
</style>
