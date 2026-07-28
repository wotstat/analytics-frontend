<template>
  <DebugSection title="Подсветка поиска" id="highlight"
    description="HighlightedCellLine показывает совпадения подстроки в нике. Проверять надо совпадение в начале, в середине, в конце, вразбивку и полное отсутствие совпадений — и всё это на реальных никах с юникодом."
    source="src/shared/ui/tableView/cells/HighlightedCell.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">данные</span>
        <select v-model="source">
          <option v-for="variant in dataSources" :key="variant.value" :value="variant.value">{{ variant.label }}
          </option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">поиск</span>
        <input type="text" v-model="search" placeholder="подстрока">
      </label>

      <label class="debug-control">
        <span class="debug-label">прятать без совпадений</span>
        <input type="checkbox" v-model="hideEmpty">
      </label>

      <label class="debug-control">
        <span class="debug-label">данные с разметкой</span>
        <input type="checkbox" v-model="markup">
      </label>

      <span class="debug-hint" v-if="markup">выбор данных выключен: показаны четыре ника с разметкой</span>
      <span class="debug-hint" v-else-if="source === 'real'">запрос: <span
          class="debug-value">{{ statusText }}</span></span>
    </div>

    <div class="debug-row">
      <span class="debug-label">пресеты:</span>
      <button class="debug-btn" v-for="preset in presets" :key="preset.value" :class="{ active: search === preset.value }"
        @click="search = preset.value">
        {{ preset.label }}
      </button>
      <button class="debug-btn" @click="search = ''">Очистить</button>
    </div>

    <div class="debug-row">
      <span class="debug-hint">строк в наборе: <span class="debug-value">{{ visible.length }}</span></span>
      <span class="debug-hint">первое совпадение: <span class="debug-value">{{ firstMatch }}</span></span>
    </div>

    <div class="demo-layout">
      <div class="debug-stage table-stage">
        <TableView ref="table" :delegate background-color="#2a2a2a" />
      </div>

      <EventLog :entries="entries" @clear="clear" title="Клики" empty="Кликни по строке" />
    </div>

    <p class="debug-note">
      Поиск не подстрочный, а подпоследовательный: символы ищутся по порядку, но не подряд. Поэтому
      <span class="debug-value">sw</span> подсвечивает <b>S</b>hadow_<b>W</b>olf двумя отдельными интервалами, а
      совпадение «в середине» и «в конце» — это один интервал с ненулевым началом. Ещё строка нормализуется:
      регистр, диакритика (<span class="debug-value">é → e</span>) и <span class="debug-value">ł → l</span>,
      поэтому подсветиться может символ, который в запросе выглядит иначе.
    </p>

    <p class="debug-note">
      Пустой запрос — это ноль интервалов, и ячейка показывает обычный
      <span class="debug-value">p</span> вместо подсвеченного. Переключение делает
      <span class="debug-value">setHighlightedVisible</span>, и оно закешировано в поле ячейки: это как раз
      правильный пример «не трогать DOM, если ничего не изменилось» — при переиспользовании поле честно сравнивается
      с новым значением.
    </p>

    <p class="debug-note">
      Объекты <span class="debug-value">Highlighted</span> создаются один раз на строку и живут рядом с данными:
      <span class="debug-value">setSubstring</span> только запоминает запрос, а интервалы считаются лениво при первом
      обращении — то есть только для видимых строк. Отсюда правило: не создавать
      <span class="debug-value">new Highlighted</span> внутри <span class="debug-value">cellForIndex</span>. Тумблер
      «прятать без совпадений» это правило нарушает вынужденно — фильтр обязан посчитать интервалы для всего набора.
    </p>

    <p class="debug-note">
      Подсвеченный текст собирается узлами: <span class="debug-value">createTextNode</span> на обычные куски,
      <span class="debug-value">span.textContent</span> на подсвеченные, и всё это разом через
      <span class="debug-value">replaceChildren</span>. Раньше строки конкатенировались и писались в
      <span class="debug-value">innerHTML</span> без экранирования — ники «Мира танков» угловых скобок не содержат, но
      ячейка общая, и произвольный текст попадал в разметку как есть. Включи «данные с разметкой»: теги обязаны быть
      видны как текст, а в консоли и в DOM не должно появиться ни одного лишнего элемента.
    </p>

    <p class="debug-note">
      На реальных данных смотреть надо на длинные ники, кириллицу и юникодные символы: ячейка обрезает текст
      многоточием, а подсветка не должна разъезжаться на составных символах.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, useTemplateRef, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import type { TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import type { ComponentInstance } from '@/shared/utils/types/ComponentInstance'
import { HighlightedCellLine } from '@/shared/ui/tableView/cells/HighlightedCell'
import type { SelectableCellLine } from '@/shared/uiKit/tableView/tableView/default/SelectableCellLine'
import { Highlighted } from '@/shared/uiKit/highlightString/highlightUtils'
import { isErrorStatus, loading } from '@/db'
import { dataSources, type DataSource } from '@/pages/debug/shared/fixtures/types'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { useRealTableRows } from '@/pages/debug/shared/fixtures/realSeries'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const ROW_HEIGHT = 35

const presets = [
  { value: 'sha', label: 'в начале: sha' },
  { value: 'wolf', label: 'в середине: wolf' },
  { value: '7', label: 'в конце: 7' },
  { value: 'sw', label: 'вразбивку: sw' },
  { value: 'ов', label: 'кириллица: ов' },
  { value: 'zzz', label: 'без совпадений: zzz' },
]

// Ники, которых в игре не бывает: ячейка обязана показать их текстом, а не разметкой.
const markupNames = [
  '<b>Shadow_Wolf</b>',
  '<img src=x onerror="alert(1)"> Steel',
  'Tiger & <Panther>',
  '</span>Танкист<span class="highlight">',
]

const table = useTemplateRef<ComponentInstance<typeof TableView>>('table')
const source = ref<DataSource>('synthetic')
const search = ref('')
const hideEmpty = ref(false)
const markup = ref(false)

const { entries, push, clear } = useEventLog()

const isReal = computed(() => source.value === 'real')
const { rows: realRows, status } = useRealTableRows(isReal, 500)

const syntheticRows = syntheticTableRows(2_000, 17)

const statusText = computed(() => {
  if (status.value === loading) return 'загрузка'
  if (isErrorStatus(status.value)) return `ошибка: ${status.value.reason}`
  return `готово, строк ${realRows.value.length}`
})

// Highlighted живёт рядом с данными и переживает пересоздание строк: интервалы
// считаются лениво, поэтому для невидимых строк они не считаются вовсе.
const highlighted = computed(() => {
  if (markup.value) return markupNames.map(name => new Highlighted(name))

  const rows = isReal.value ? realRows.value : syntheticRows
  return rows.map(row => new Highlighted(row.name))
})

const visible = computed(() => {
  if (!hideEmpty.value) return highlighted.value

  const query = search.value
  return highlighted.value.filter(item => {
    item.setSubstring(query)
    return item.intervals.length > 0
  })
})

const firstMatch = computed(() => {
  const query = search.value
  if (query.length === 0) return 'запрос пустой'

  for (const item of visible.value) {
    item.setSubstring(query)
    if (item.intervals.length === 0) continue
    return `${item.text} → ${JSON.stringify(item.intervals)}`
  }

  return 'ничего не найдено'
})

const delegate: TableViewDelegate = markRaw({

  onSetupComplete: table => {
    table.registerReusable(HighlightedCellLine.reusableKey, () => new HighlightedCellLine(onClick), 40)
  },

  numberOfSections: () => 1,
  numberOfRowsInSection: () => visible.value.length,

  heightForCellByIndex: () => ROW_HEIGHT,
  cellForIndex: (table, index) => {
    const cell = table.getReusable<HighlightedCellLine>(HighlightedCellLine.reusableKey)
    const item = visible.value[index.row]
    item.setSubstring(search.value)
    cell.configure({ highlightedText: item, index, selectable: true, selected: false })
    return { cell, reusableKey: HighlightedCellLine.reusableKey }
  },
})

function onClick(cell: SelectableCellLine) {
  const index = cell.indexPath
  if (!index) return
  push(`строка ${index.row}: ${visible.value[index.row]?.text}`)
}

// Запрос, источник и фильтр — обычные ref'ы: до таблицы они доходят только так.
watch([visible, search], () => table.value?.dataDidUpdate())

</script>


<style scoped lang="scss">
.demo-layout {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(240px, 0.7fr);
  gap: 0.75em;
  align-items: start;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

.table-stage {
  padding: 0.5em;
  height: 340px;
  box-sizing: border-box;
}

:deep(.highlighted-cell-line) {
  p {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
