<template>
  <DebugSection title="HighlightString" id="highlight-string" source="src/shared/uiKit/highlightString/"
    description="Подсветка — это не поиск подстроки, а посимвольный fuzzy-матч по порядку букв. Проверь пресеты и спецсимволы регэкспа в поле ниже.">

    <p class="debug-note">
      <span class="debug-value">highlight(text, query)</span> ищет буквы query внутри text по порядку, но не обязательно
      подряд (как автодополнение команд): совпавшие индексы группируются в интервалы только там, где они реально идут
      друг за другом. Поэтому «совпадение» — это не всегда одна подсвеченная подстрока, а иногда несколько разрозненных
      кусочков в одном результате.
    </p>

    <div class="debug-col">
      <span class="debug-label">Пресеты</span>
      <div class="debug-row">
        <button class="debug-btn" v-for="p in presets" :key="p.label"
          :class="{ active: text === p.text && query === p.query }" @click="applyPreset(p)">{{ p.label }}</button>
      </div>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">text</span>
          <input type="text" v-model="text">
        </label>
        <label class="debug-control">
          <span class="debug-label">query</span>
          <input type="text" v-model="query">
        </label>
      </div>

      <div class="debug-stage short">
        <HighlightString :text="highlighted" />
      </div>

      <p class="debug-hint">
        интервалы (индексы символов в нормализованной строке):
        <span class="debug-value">{{ JSON.stringify(highlighted.highlight) }}</span>
      </p>

      <p class="debug-note">
        Спецсимволы регэкспа в запросе (пресет «спецсимволы регэкспа») не падают и не экранируются — им и не нужно
        экранирование: сравнение посимвольное, через оператор равенства, ни строка, ни запрос ни разу не попадают в
        конструктор RegExp. Регистр игнорируется нормализацией (toLowerCase + разбор диакритики), но исходный регистр
        в подсветке сохраняется — сравни пресет «регистр» с исходным текстом. Кириллица и латиница не совпадают друг с
        другом даже для похожих на вид букв: это разные символы.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">Форс highlight: undefined мимо типов</span>
      <label class="debug-control">
        <span class="debug-label">сломать проп</span>
        <input type="checkbox" v-model="forceBroken">
      </label>

      <div class="debug-stage short">
        <HighlightString :text="brokenExample" />
      </div>

      <p class="debug-note" v-if="forceBroken">
        Похоже на баг в самом компоненте: в вычисляемом labelIntervaled ветка «нет highlight» возвращает
        text: props.text — весь объект-проп целиком, а не props.text.text. При типизированном использовании highlight
        всегда массив (даже пустой, а пустой массив — истинный), так что ветка на практике недостижима. Но если
        подсунуть highlight: undefined мимо системы типов (как здесь), в шаблон попадает объект вместо строки, и на
        экране выше — «[object Object]».
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import HighlightString from '@/shared/uiKit/highlightString/HighlightString.vue'
import { highlight, type HighlightedString } from '@/shared/uiKit/highlightString/highlightUtils'

type Preset = { label: string, text: string, query: string }

const presets: Preset[] = [
  { label: 'начало', text: 'Championship', query: 'Cham' },
  { label: 'середина', text: 'Championship', query: 'ampio' },
  { label: 'конец', text: 'Championship', query: 'ship' },
  { label: 'несколько фрагментов', text: 'abcabc', query: 'ac' },
  { label: 'регистр', text: 'ПРИВЕТ мир', query: 'привет' },
  { label: 'кириллица/латиница', text: 'Tanks', query: 'танки' },
  { label: 'пустой запрос', text: 'Курск', query: '' },
  { label: 'запрос длиннее строки', text: 'кот', query: 'котёнок' },
  { label: 'спецсимволы регэкспа', text: '1.2*3(4)5[6]7', query: '.*([' },
  { label: 'без совпадений', text: 'Тигр', query: 'слон' },
]

const text = ref(presets[0].text)
const query = ref(presets[0].query)

function applyPreset(p: Preset) {
  text.value = p.text
  query.value = p.query
}

const highlighted = computed<HighlightedString>(() => highlight(text.value, query.value))

const forceBroken = ref(false)
const brokenExample = computed<HighlightedString>(() => {
  const normal = highlight('Пример строки', 'стро')
  if (!forceBroken.value) return normal
  return { text: normal.text, highlight: undefined } as unknown as HighlightedString
})

</script>


<style scoped lang="scss">
.debug-stage :deep(.highlight) {
  color: var(--blue-thin-color);
  font-weight: 600;
}
</style>
