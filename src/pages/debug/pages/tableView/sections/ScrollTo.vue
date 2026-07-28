<template>
  <DebugSection title="scrollTo" id="scroll-to"
    description="Прокрутка к строке, к началу секции и к последней строке, обоими ScrollBehavior. Рядом числа: куда должно уехать, куда уехало на самом деле и что дала бы старая формула."
    source="src/shared/uiKit/tableView/tableView/TableView.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">секция</span>
        <select v-model.number="targetSection">
          <option v-for="section in sectionIndexes" :key="section" :value="section">{{ section }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">строка</span>
        <input type="number" v-model.number="targetRow" min="0" step="1">
      </label>

      <label class="debug-control">
        <span class="debug-label">behavior</span>
        <select v-model="behavior">
          <option v-for="variant in behaviors" :key="variant" :value="variant">{{ variant }}</option>
        </select>
      </label>

      <button class="debug-btn" @click="scrollToTarget">scrollTo</button>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="go(0, 0)">К самой первой строке</button>
      <button class="debug-btn" @click="go(2, 0)">К началу секции 2</button>
      <button class="debug-btn" @click="go(SECTION_COUNT - 1, SECTION_SIZE - 1)">К последней строке</button>
      <label class="debug-control">
        <span class="debug-label">разные высоты заголовков</span>
        <input type="checkbox" v-model="varyHeaders" @change="update">
      </label>
      <label class="debug-control">
        <span class="debug-label">разные высоты строк</span>
        <input type="checkbox" v-model="varyRows" @change="update">
      </label>
    </div>

    <div class="demo-layout">
      <div class="debug-stage table-stage" ref="stage">
        <TableView ref="table" :delegate background-color="#2a2a2a" />
      </div>

      <table class="debug-table">
        <thead>
          <tr>
            <th>scrollTop</th>
            <th>значение</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>ожидаемый: верх строки минус её заголовок</th>
            <td>{{ Number.isFinite(expected) ? expected : 'NaN — строки нет' }}</td>
          </tr>
          <tr>
            <th>он же с учётом предела прокрутки</th>
            <td>{{ Number.isFinite(clamped) ? clamped : '—' }}</td>
          </tr>
          <tr>
            <th>фактический</th>
            <td :class="{ true: actualMatches === true, false: actualMatches === false }">{{ actual }}</td>
          </tr>
          <tr>
            <th>что дала бы старая формула</th>
            <td>{{ Number.isNaN(oldEngine) ? 'NaN' : oldEngine }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="debug-note">
      Формула внутри метода:
      <span class="debug-value">rowsTopOffset[глобальный номер строки] − headersHeight[section]</span>.
      <span class="debug-value">rowsTopOffset</span> проиндексирован <b>глобальным</b> номером строки и уже включает в
      себя все заголовки и футеры выше, поэтому номер строки внутри секции приводится к глобальному через
      <span class="debug-value">rowIndex(section, row)</span>, а второе слагаемое из формулы не нужно.
    </p>

    <p class="debug-note">
      Было иначе: <span class="debug-value">sectionTopOffset[section] + rowsTopOffset[row] − headersHeight[section]</span>,
      где в <span class="debug-value">rowsTopOffset</span> уходил номер строки <b>внутри</b> секции. Две ошибки —
      лишнее слагаемое и чужой индекс — при одинаковых высотах строк и заголовков сокращались арифметически, поэтому
      метод работал и баг никто не замечал. Включи «разные высоты заголовков» или «разные высоты строк» и возьми строку
      в секции 2 или 3: нижняя строка таблицы разойдётся с первой, а «фактический» останется на ожидаемом.
    </p>

    <p class="debug-note">
      Второй край: если строки с таким номером в секции нет, обращение к массиву даёт
      <span class="debug-value">undefined</span>, а вся арифметика — <span class="debug-value">NaN</span>. Прежняя
      проверка смотрела на <span class="debug-value">!== undefined</span> и NaN не отсеивала: браузер такой
      <span class="debug-value">top</span> отбрасывал сам, и прокрутки не происходило молча. Теперь стоит
      <span class="debug-value">Number.isFinite</span> и <span class="debug-value">console.warn</span> с индексами —
      поставь секцию 3 и строку 90 (в секции их 25) и посмотри в консоль.
    </p>

    <p class="debug-note">
      Вычитание высоты заголовка — не ошибка, а замысел: строка встаёт не под верхний край, а на высоту заголовка
      ниже, чтобы шапка секции осталась видна. Для <span class="debug-value">{ section: 0, row: 0 }</span> это даёт
      ровный ноль.
    </p>

    <p class="debug-note">
      <span class="debug-value">behavior</span> уходит в нативный <span class="debug-value">scrollTo</span> как есть,
      так что доступны все три значения <span class="debug-value">ScrollBehavior</span>, включая
      <span class="debug-value">auto</span>. При <span class="debug-value">smooth</span> таблица планирует пересчёт
      только один раз, а дальше живёт на событиях прокрутки: видимый интервал пересчитывается на каждом кадре
      анимации, но уже двоичным поиском (см. <a href="#virtualization">виртуализацию</a>).
    </p>

    <p class="debug-note">
      Прокрутка ограничена высотой контента: у последней строки ожидаемое значение больше предела, и браузер обрезает
      его до <span class="debug-value">scrollHeight − clientHeight</span>. Поэтому «фактический» сверяется со второй
      строкой таблицы, а не с первой.
    </p>

    <p class="debug-note">
      Пальцем: после <span class="debug-value">smooth</span> касание должно прерывать анимацию (это делает браузер, а
      не таблица). На iOS <span class="debug-value">instant</span> в момент активной инерции может «отпружинить» —
      проверять надо на остановленной прокрутке.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, onUnmounted, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import type { TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import { HeaderLine } from '@/shared/uiKit/tableView/tableView/default/HeaderLine'
import type { ComponentInstance } from '@/shared/utils/types/ComponentInstance'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { RowCell } from '../shared/RowCell'

const SECTION_COUNT = 4
const SECTION_SIZE = 25
const FOOTER_HEIGHT = 16

const behaviors = ['instant', 'smooth', 'auto'] as const satisfies readonly ScrollBehavior[]

const sectionIndexes = Array.from({ length: SECTION_COUNT }, (_, index) => index)
const rows = syntheticTableRows(SECTION_COUNT * SECTION_SIZE, 29)

const table = useTemplateRef<ComponentInstance<typeof TableView>>('table')
const stage = useTemplateRef<HTMLElement>('stage')

const targetSection = ref(2)
const targetRow = ref(5)
const behavior = ref<ScrollBehavior>('instant')
const varyHeaders = ref(false)
const varyRows = ref(false)
const actual = ref(0)
const maxScroll = ref(0)

function rowHeight(globalIndex: number) {
  return varyRows.value ? 26 + (globalIndex % 3) * 10 : 30
}

function headerHeight(section: number) {
  if (!varyHeaders.value) return 33
  return section === 0 ? 60 : 24
}

function sectionRowsHeight(section: number) {
  let sum = 0
  for (let row = 0; row < SECTION_SIZE; row++) sum += rowHeight(section * SECTION_SIZE + row)
  return sum
}

// Абсолютный верх секции — то, что движок держит в sectionTopOffset.
function sectionTop(section: number) {
  let sum = 0
  for (let i = 0; i < section; i++) sum += headerHeight(i) + sectionRowsHeight(i) + FOOTER_HEIGHT
  return sum
}

// Абсолютный верх строки по глобальному номеру — то, что лежит в rowsTopOffset.
function globalRowTop(globalIndex: number) {
  if (globalIndex >= SECTION_COUNT * SECTION_SIZE) return NaN

  const section = Math.floor(globalIndex / SECTION_SIZE)
  let top = sectionTop(section) + headerHeight(section)
  for (let row = section * SECTION_SIZE; row < globalIndex; row++) top += rowHeight(row)
  return top
}

// Ровно та арифметика, что в TableView.scrollTo: верх строки по её глобальному номеру.
const expected = computed(() => {
  const global = targetSection.value * SECTION_SIZE + targetRow.value
  return Math.round(globalRowTop(global) - headerHeight(targetSection.value))
})

// Больше предела браузер не прокрутит, так что сверяться надо с обрезанным значением.
const clamped = computed(() => Math.min(Math.max(expected.value, 0), maxScroll.value))

// null — сверять не с чем: строки нет, прокрутка и не должна была случиться.
const actualMatches = computed(() => {
  if (!Number.isFinite(clamped.value)) return null
  return Math.abs(actual.value - clamped.value) <= 1
})

// Прежняя формула: лишний sectionTopOffset и номер строки внутри секции вместо глобального.
const oldEngine = computed(() => {
  return Math.round(sectionTop(targetSection.value)
    + globalRowTop(targetRow.value)
    - headerHeight(targetSection.value))
})

const delegate: TableViewDelegate = markRaw({

  onSetupComplete: table => {
    table.registerReusable(RowCell.reusableKey, () => new RowCell(), 40)
    table.registerReusable(HeaderLine.reusableKey, () => new HeaderLine())
  },

  numberOfSections: () => SECTION_COUNT,
  numberOfRowsInSection: () => SECTION_SIZE,

  heightForCellByIndex: (_, index) => rowHeight(index.section * SECTION_SIZE + index.row),
  cellForIndex: (table, index) => {
    const global = index.section * SECTION_SIZE + index.row
    const cell = table.getReusable<RowCell>(RowCell.reusableKey)
    cell.configure({ row: rows[global], index, height: rowHeight(global) })
    return { cell, reusableKey: RowCell.reusableKey }
  },

  heightForHeaderInSection: (_, section) => headerHeight(section),
  headerCellForSection: (table, section) => {
    const header = table.getReusable<HeaderLine>(HeaderLine.reusableKey)
    header.setTitle(`Секция ${section}`)
    return { header, reusableKey: HeaderLine.reusableKey }
  },

  heightForFooterInSection: () => FOOTER_HEIGHT,
})

function scrollToTarget() {
  table.value?.scrollTo({ section: targetSection.value, row: targetRow.value }, behavior.value)
}

function go(section: number, row: number) {
  targetSection.value = section
  targetRow.value = row
  scrollToTarget()
}

function update() {
  table.value?.dataDidUpdate()
}

// Фактический scrollTop живёт в служебном div'е внутри таблицы, наружу его не отдают.
const timer = setInterval(() => {
  const scroll = stage.value?.querySelector('.scroll')
  actual.value = scroll ? Math.round(scroll.scrollTop) : 0
  maxScroll.value = scroll ? Math.round(scroll.scrollHeight - scroll.clientHeight) : 0
}, 150)

onUnmounted(() => clearInterval(timer))

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
</style>
