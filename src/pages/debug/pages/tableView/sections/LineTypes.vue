<template>
  <DebugSection title="Типы строк и выделение" id="line-types"
    description="Три готовых класса строк и своя ячейка — в одной таблице, по секции на каждый. Выделением таблица не управляет: состояние держит страница, а строка получает его при каждом создании."
    source="src/shared/uiKit/tableView/tableView/default/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">выделение</span>
        <select v-model="selectionMode" @change="onModeChange">
          <option v-for="variant in selectionModes" :key="variant.value" :value="variant.value">
            {{ variant.label }}
          </option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">grouped-style</span>
        <input type="checkbox" v-model="grouped">
      </label>

      <button class="debug-btn" @click="clearSelection">Снять выделение</button>
      <span class="debug-hint">выделено: <span class="debug-value">{{ selected.size }}</span></span>
    </div>

    <div class="demo-layout">
      <div class="debug-stage table-stage">
        <TableView ref="table" :delegate :class="{ 'grouped-style': grouped }" background-color="#2a2a2a" />
      </div>

      <EventLog :entries="entries" @clear="clear" title="Клики по строкам"
        empty="Кликни по строке во второй или третьей секции" />
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>класс</th>
          <th>корневой тег</th>
          <th>API</th>
          <th>реальная высота</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>CellLine</th>
          <td>div</td>
          <td><span class="debug-value">setText(string)</span></td>
          <td>35 px из <span class="debug-path">reusableTable.scss</span></td>
        </tr>
        <tr>
          <th>SelectableCellLine</th>
          <td>button</td>
          <td><span class="debug-value">configure({ text, selectable, selected, index })</span>, геттеры
            <span class="debug-value">isSelected</span> / <span class="debug-value">indexPath</span></td>
          <td>35 px, те же стили + <span class="debug-value">.selectable</span></td>
        </tr>
        <tr>
          <th>HeaderLine</th>
          <td>div &gt; h5</td>
          <td><span class="debug-value">setTitle(string)</span></td>
          <td>33 px: 20 px высоты и 13 px паддингов</td>
        </tr>
        <tr>
          <th>FooterLine</th>
          <td>div &gt; p</td>
          <td><span class="debug-value">setTitle(string)</span></td>
          <td class="false">стилей нет вообще — высоту задаёт потребитель</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Таблица не знает про выделение ничего. Клик приходит в саму строку, дальше страница правит своё состояние и
      обязана: во-первых, выставлять <span class="debug-value">selected</span> в
      <span class="debug-value">cellForIndex</span> (иначе выделение пропадёт, как только строка уедет за край и
      вернётся), во-вторых, обновить строку, которая сейчас на экране. Полный
      <span class="debug-value">dataDidUpdate()</span> ради одной строки — перебор.
    </p>

    <p class="debug-note">
      Точечное обновление делает <span class="debug-value">getCellInstancesForIndexPath(indexPath)</span>. Он
      возвращает <b>массив</b>, потому что экземпляров у видимой строки два — по одному на слой (см.
      <a href="#delegate">делегат</a>); обновлять надо все. Для невидимой строки массив пустой, и это нормально:
      её всё равно создадут заново. Метода нет у Vue-обёртки — только у объекта из
      <span class="debug-value">onSetupComplete</span>.
    </p>

    <p class="debug-note">
      Одиночное выделение приходится снимать руками со старой строки: <span class="debug-value">grouped-style</span>
      добавляет разделители между соседними выделенными строками, поэтому «залипшее» выделение сразу заметно.
      <span class="debug-value">SelectableCellLine</span> — это <span class="debug-value">button</span>: у неё есть
      фокус с клавиатуры, но обработчика клавиш нет, так что Enter/Space сработают только штатным кликом кнопки.
    </p>

    <p class="debug-note">
      Пальцем: тап по строке должен выделять, а свайп по списку — нет. Никакого порога сдвига у
      <span class="debug-value">SelectableCellLine</span> нет, она слушает обычный
      <span class="debug-value">click</span>, и его гасит уже сам браузер при прокрутке. Ховера на тач-устройствах
      нет — он под <span class="debug-value">@media (hover: hover)</span>.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import type { IndexPath, TableView as TableViewEngine, TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import { CellLine } from '@/shared/uiKit/tableView/tableView/default/CellLine'
import { SelectableCellLine } from '@/shared/uiKit/tableView/tableView/default/SelectableCellLine'
import { HeaderLine } from '@/shared/uiKit/tableView/tableView/default/HeaderLine'
import { FooterLine } from '@/shared/uiKit/tableView/tableView/default/FooterLine'
import type { ComponentInstance } from '@/shared/utils/types/ComponentInstance'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { formatInt } from '../shared/format'
import { RowCell } from '../shared/RowCell'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const ROW_HEIGHT = 35
const HEADER_HEIGHT = 33
const FOOTER_HEIGHT = 24
const SECTION_SIZE = 30

const selectionModes = [
  { value: 'none', label: 'нет' },
  { value: 'single', label: 'одиночное' },
  { value: 'multi', label: 'множественное' },
] as const

const sections = [
  { title: 'CellLine — только текст, кликов нет' },
  { title: 'SelectableCellLine — выделение' },
  { title: 'Своя ячейка: колонки и выделение' },
]

const rows = syntheticTableRows(SECTION_SIZE * sections.length, 5)

const table = useTemplateRef<ComponentInstance<typeof TableView>>('table')
const selectionMode = ref<typeof selectionModes[number]['value']>('single')
const grouped = ref(false)
const selected = ref(new Set<string>())

const { entries, push, clear } = useEventLog()

let instance: TableViewEngine | null = null

function rowData(index: IndexPath) {
  return rows[index.section * SECTION_SIZE + index.row]
}

function key(index: IndexPath) {
  return `${index.section}:${index.row}`
}

function parseKey(value: string): IndexPath {
  const [section, row] = value.split(':').map(Number)
  return { section, row }
}

const delegate: TableViewDelegate = markRaw({

  onSetupComplete: table => {
    instance = table
    table.registerReusable(CellLine.reusableKey, () => new CellLine(), 30)
    table.registerReusable(SelectableCellLine.reusableKey, () => new SelectableCellLine(onSelectableClick), 30)
    table.registerReusable(RowCell.reusableKey, () => new RowCell({ onClick }), 30)
    table.registerReusable(HeaderLine.reusableKey, () => new HeaderLine())
    table.registerReusable(FooterLine.reusableKey, () => new FooterLine())
  },

  numberOfSections: () => sections.length,
  numberOfRowsInSection: () => SECTION_SIZE,

  heightForCellByIndex: () => ROW_HEIGHT,
  cellForIndex: (table, index) => {
    if (index.section === 0) {
      const cell = table.getReusable<CellLine>(CellLine.reusableKey)
      cell.setText(`${rowData(index).name} — ${formatInt(rowData(index).battles)} боёв`)
      return { cell, reusableKey: CellLine.reusableKey }
    }

    if (index.section === 1) {
      const cell = table.getReusable<SelectableCellLine>(SelectableCellLine.reusableKey)
      cell.configure({
        text: rowData(index).name,
        index,
        selected: selected.value.has(key(index)),
        selectable: selectionMode.value !== 'none',
      })
      return { cell, reusableKey: SelectableCellLine.reusableKey }
    }

    const cell = table.getReusable<RowCell>(RowCell.reusableKey)
    cell.configure({ row: rowData(index), index, height: ROW_HEIGHT, selected: selected.value.has(key(index)) })
    return { cell, reusableKey: RowCell.reusableKey }
  },

  heightForHeaderInSection: () => HEADER_HEIGHT,
  headerCellForSection: (table, section) => {
    const header = table.getReusable<HeaderLine>(HeaderLine.reusableKey)
    header.setTitle(sections[section].title)
    return { header, reusableKey: HeaderLine.reusableKey }
  },

  heightForFooterInSection: () => FOOTER_HEIGHT,
  footerCellForSection: (table, section) => {
    const footer = table.getReusable<FooterLine>(FooterLine.reusableKey)
    footer.setTitle(`секция ${section} · строк: ${SECTION_SIZE}`)
    return { footer, reusableKey: FooterLine.reusableKey }
  },
})

function onSelectableClick(cell: SelectableCellLine) {
  if (cell.indexPath) select(cell.indexPath)
}

function onClick(index: IndexPath) {
  select(index)
}

function select(index: IndexPath) {
  if (selectionMode.value === 'none') return

  const target = key(index)
  const wasSelected = selected.value.has(target)
  const previous = selectionMode.value === 'single' ? [...selected.value] : []

  if (selectionMode.value === 'single') selected.value.clear()
  if (wasSelected) selected.value.delete(target)
  else selected.value.add(target)

  // Обновляем ровно то, что видно: полный dataDidUpdate ради одной строки не нужен.
  refreshRow(index)
  for (const value of previous) refreshRow(parseKey(value))

  push(`клик ${target} → ${selected.value.has(target) ? 'выделена' : 'снята'}, всего ${selected.value.size}`)
}

function refreshRow(index: IndexPath) {
  if (!instance) return

  if (index.section === 1) {
    for (const cell of instance.getCellInstancesForIndexPath<SelectableCellLine>(index)) {
      cell.setSelected(selected.value.has(key(index)))
    }
    return
  }

  for (const cell of instance.getCellInstancesForIndexPath<RowCell>(index)) {
    cell.configure({ row: rowData(index), index, height: ROW_HEIGHT, selected: selected.value.has(key(index)) })
  }
}

function clearSelection() {
  selected.value.clear()
  table.value?.dataDidUpdate()
  push('выделение снято целиком → dataDidUpdate')
}

function onModeChange() {
  selected.value.clear()
  table.value?.dataDidUpdate()
}

onUnmounted(() => {
  instance = null
})

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

// FooterLine приезжает вообще без стилей: без этого блока футер — просто текст без отступов.
:deep(.footer-line) {
  height: 24px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  color: #ffffff66;
}
</style>
