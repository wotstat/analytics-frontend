<template>
  <DebugSection title="SearchLine и подсветка совпадений" id="search"
    description="Одна и та же строка поиска стоит во всех попапах. Проверяем совпадение в начале и в середине, кириллицу и латиницу, пустой результат, крестик очистки и очень длинный запрос."
    source="src/shared/game/selectors/components/searchLine/SearchLine.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">placeholder</span>
        <input type="text" v-model="placeholder">
      </label>

      <label class="debug-control">
        <span class="debug-label">autofocus</span>
        <input type="checkbox" v-model="autofocus">
      </label>

      <button class="debug-btn" @click="mountKey++">перемонтировать</button>
      <button class="debug-btn" @click="query = longQuery">очень длинный запрос</button>
      <button class="debug-btn" @click="query = 'т34'">т34</button>
      <button class="debug-btn" @click="query = '268'">268</button>
      <button class="debug-btn" @click="query = 'lowe'">lowe</button>
      <button class="debug-btn" @click="query = 'zzzz'">zzzz</button>
    </div>

    <div class="debug-stage">
      <div class="search-box">
        <SearchLine v-model="query" :placeholder="placeholder || undefined" :autofocus :key="mountKey"
          @clear="clears++" />
      </div>
    </div>

    <div class="debug-row">
      <span class="debug-hint">value: <span class="debug-value">{{ query === '' ? '(пусто)' : query }}</span></span>
      <span class="debug-hint">длина: <span class="debug-value">{{ query.length }}</span></span>
      <span class="debug-hint">событий clear: <span class="debug-value">{{ clears }}</span></span>
    </div>

    <p class="debug-note">
      <span class="debug-value">autofocus</span> отрабатывает только в
      <span class="debug-value">onMounted</span> и только на устройстве с мышью
      (<span class="debug-value">(hover: hover) and (pointer: fine)</span>), поэтому проверять его надо кнопкой
      «перемонтировать», а не галкой. На тач-устройстве фокуса не будет намеренно — иначе попап открывался бы вместе с
      экранной клавиатурой.
    </p>

    <p class="debug-note">
      Крестик при пустом значении не просто прозрачный, а <span class="debug-value">display: none</span> — место под
      него не зарезервировано, так что при первом символе текст не должен дёргаться. Крестик и чистит значение, и
      отдельно эмитит <span class="debug-value">clear</span>; попапы это событие не слушают. Дебаунса нет: список
      перефильтровывается на каждый символ, поэтому «очень длинный запрос» на полном списке техники — это ещё и
      проверка на подвисание.
    </p>

    <div class="debug-col">
      <span class="debug-label">Подсветка: тот же запрос по списку названий</span>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">источник</span>
          <select v-model="source">
            <option value="fixtures">фикстуры (крайние случаи)</option>
            <option value="vehicles">реальные названия техники</option>
          </select>
        </label>

        <label class="debug-control">
          <span class="debug-label">только совпадения</span>
          <input type="checkbox" v-model="onlyMatched">
        </label>

        <label class="debug-control">
          <span class="debug-label">сортировать по compareIntervals</span>
          <input type="checkbox" v-model="sortByMatch">
        </label>

        <label class="debug-control">
          <span class="debug-label">читать .intervals до рендера</span>
          <input type="checkbox" v-model="warmup">
        </label>
      </div>

      <div class="debug-stage">
        <div class="results" v-if="items.length > 0">
          <div class="row" v-for="item in items" :key="item.key">
            <HighlightString class="text" :text="item.highlighted.highlightedString" />
            <span class="debug-value">{{ JSON.stringify(item.intervals) }}</span>
          </div>
        </div>

        <p class="debug-hint" v-else>Ничего не найдено — так же выглядит «Танков не найдено» внутри попапа</p>
      </div>

      <p class="debug-note">
        Совпадение считается <b>подпоследовательностью</b>, а не подстрокой: символы запроса ищутся по порядку, но
        необязательно рядом. Поэтому «т34» находит «Т-34», а «268» — «Объект 268» и заодно любое название, где эти
        цифры разбросаны. Порядок задаёт
        <span class="debug-value">compareIntervals</span>: сначала самый длинный непрерывный кусок, потом меньшее число
        кусков, потом позиция — так «совпало в начале» оказывается выше «совпало в середине». Выключи сортировку и
        сравни.
      </p>

      <p class="debug-note">
        <span class="debug-value">normalize</span> перед сравнением делает
        <span class="debug-value">lowerCase + trim + NFD</span>, снимает диакритику и меняет
        <span class="debug-value">ł</span> на <span class="debug-value">l</span>: «lowe» находит «Löwe», «skoda» —
        «Škoda». <b>Но</b> <span class="debug-value">trim()</span> сдвигает индексы: у фикстуры
        «␣␣пробелы по краям␣␣» интервалы посчитаны по обрезанной строке, а применяются к исходной — подсветка съезжает
        влево на число ведущих пробелов. На данных из БД это не всплывает только потому, что там нет имён с пробелами
        по краям.
      </p>

      <p class="debug-note">
        Галка «читать .intervals до рендера» показывает вторую ловушку: геттер
        <span class="debug-value">highlightedString</span> отдаёт
        <span class="debug-value">computedIntervals || []</span> и, в отличие от
        <span class="debug-value">intervals</span>, ленивый расчёт сам не запускает. Сними галку — подсветка исчезнет,
        хотя совпадения есть. Все попапы спасает только то, что они сначала фильтруют список по
        <span class="debug-value">.intervals</span>, а рисуют уже потом.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import HighlightString from '@/shared/uiKit/highlightString/HighlightString.vue'
import { compareIntervals, Highlighted } from '@/shared/uiKit/highlightString/highlightUtils'
import { highlightSamples, longQuery } from '../shared/fixtures'
import { vehicleNames } from '../shared/lists'

const MAX_ROWS = 60

const query = ref('')
const placeholder = ref('')
const autofocus = ref(false)
const mountKey = ref(0)
const clears = ref(0)

const source = ref<'fixtures' | 'vehicles'>('fixtures')
const onlyMatched = ref(true)
const sortByMatch = ref(true)
const warmup = ref(true)

const texts = computed(() => source.value === 'fixtures'
  ? highlightSamples
  : [...new Set(vehicleNames.value.map(v => v.name))])

// Обращение к геттеру и есть весь «прогрев»: без него highlightedString отдаёт пустую подсветку.
function warm(highlighted: Highlighted) {
  return highlighted.intervals.length
}

const items = computed(() => {
  const substring = query.value

  const prepared = texts.value.map((text, index) => {
    const probe = new Highlighted(text)
    probe.setSubstring(substring)
    const intervals = probe.intervals

    const highlighted = new Highlighted(text)
    highlighted.setSubstring(substring)
    if (warmup.value) warm(highlighted)

    return { key: `${index}:${text}`, text, highlighted, intervals, matched: intervals.length > 0 }
  })

  const filtered = onlyMatched.value && substring ? prepared.filter(item => item.matched) : prepared

  if (sortByMatch.value) filtered.sort((a, b) => {
    const comp = compareIntervals(a.intervals, b.intervals)
    if (comp !== 0) return comp
    return a.text.localeCompare(b.text)
  })

  return filtered.slice(0, MAX_ROWS)
})

</script>


<style scoped lang="scss">
.search-box {
  max-width: 320px;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 0.15em;

  .row {
    display: flex;
    align-items: baseline;
    gap: 0.6em;

    .text {
      font-size: 14px;
      min-width: 14em;

      :deep(.highlight) {
        color: var(--blue-thin-color-hover);
      }
    }
  }
}
</style>
