<template>
  <div class="interval-popup-container">
    <header>
      <h1>Интервал графика</h1>

      <SearchLine v-model="currentSearch" autofocus />
    </header>

    <div class="content">
      <div class="separator"></div>

      <div class="table-container deep-nice-scrollbar-transparent">
        <TableView ref="table" :delegate :class="'grouped-style'" />
      </div>

      <div class="empty-list" v-if="displaySections.length === 0">
        <h5>Ничего не найдено</h5>
        <button @click="currentSearch = ''">Очистить фильтр</button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import { HighlightedCellLine } from '@/shared/ui/tableView/cells/HighlightedCell'
import { compareIntervals, Highlighted } from '@/shared/uiKit/highlightString/highlightUtils'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import { HeaderLine } from '@/shared/uiKit/tableView/tableView/default/HeaderLine'
import { SelectableCellLine } from '@/shared/uiKit/tableView/tableView/default/SelectableCellLine'
import { TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import { computed, ref, watch } from 'vue'

const table = ref<InstanceType<typeof TableView> | null>(null)

const props = defineProps<{}>()
const currentSearch = ref('')

const emit = defineEmits<{
  (e: 'select', value: string): void
}>()

const selectedCells = new Set<string>()

const fullData = [
  {
    name: 'Особенные',
    items: [
      'Сегодня',
      'Вчера',
      'Эта неделя',
      'Весь сезон',
    ]
  },
  {
    name: 'Недели',
    items: new Array(7).fill(0).map((_, i) => `Неделя ${i + 1}`)
  },
  {
    name: 'Дни',
    items: new Array(31).fill(0).map((_, i) => `День ${i + 1}`)
  },
]

const grouped = fullData.map(list => ({
  header: list.name,
  items: list.items.map(item => ({
    text: item,
    highlighted: new Highlighted(item)
  }))
}))

const displaySections = computed(() => {
  const search = currentSearch.value

  const filteredGroups = grouped.map(list => {
    for (const element of list.items) {
      element.highlighted.setSubstring(search)
    }

    const filtered = list.items.filter(item => !search || item.highlighted.intervals.length > 0)

    function sorted() {
      if (search) return filtered.sort((a, b) => {
        const comp = compareIntervals(a.highlighted.intervals, b.highlighted.intervals)
        if (comp !== 0) return comp
        return a.highlighted.text.localeCompare(b.highlighted.text, undefined, { numeric: true })
      })

      return filtered.sort((a, b) => a.highlighted.text.localeCompare(b.highlighted.text, undefined, { numeric: true }))
    }

    return {
      header: list.header,
      data: sorted()
    }
  })

  return filteredGroups
    .filter(tankList => tankList.data.length > 0)
    .map(t => ({
      header: t.header,
      lines: t.data
    }))
})

let sections: typeof displaySections.value = []
watch(() => displaySections.value, list => {
  sections = list
  table.value?.dataDidUpdate()
  table.value?.scrollTo({ section: 0, row: 0 }, 'instant')
}, { immediate: true })

const delegate: TableViewDelegate = {

  onSetupComplete: (table) => {
    table.registerReusable(HeaderLine.reusableKey, () => new HeaderLine())
    table.registerReusable(HighlightedCellLine.reusableKey, () => new HighlightedCellLine(c => {
      if (!c.indexPath) return

      const id = `line-${c.indexPath.section + 1}-${c.indexPath.row + 1}`
      selectedCells.has(id) ? selectedCells.delete(id) : selectedCells.add(id)
      const selected = selectedCells.has(id)

      const cells = table.getCellInstancesForIndexPath<SelectableCellLine>(c.indexPath)
      for (const cell of cells) cell.setSelected(selected)
    }))
  },

  numberOfSections: () => sections.length,
  numberOfRowsInSection: (_, section) => sections[section].lines.length,

  heightForCellByIndex: (_, index) => 35,
  cellForIndex: (table, index) => {
    const cell = table.getReusable<HighlightedCellLine>(HighlightedCellLine.reusableKey)
    const id = `line-${index.section + 1}-${index.row + 1}`
    cell.configure({
      text: sections[index.section].lines[index.row].text,
      highlightedText: sections[index.section].lines[index.row].highlighted,
      selectable: true,
      selected: selectedCells.has(id),
      index: index,
    })

    return { cell, reusableKey: HighlightedCellLine.reusableKey }
  },

  heightForHeaderInSection: (_, section) => 35,
  headerCellForSection: (table, section) => {
    const cell = table.getReusable<HeaderLine>(HeaderLine.reusableKey)
    cell.setTitle(sections[section].header)
    return { header: cell, reusableKey: HeaderLine.reusableKey }
  },

  heightForFooterInSection: (_, section) => sections.length - 1 == section ? 10 : 0,
}
</script>


<style lang="scss" scoped>
.interval-popup-container {
  padding: 10px;
  padding-bottom: 0;

  header {
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 180px;

    h1 {
      font-size: 1em;
      margin: 0;
      margin-bottom: 10px;
    }
  }

  .content {
    position: relative;

    .separator {
      height: 1px;
      background-color: rgba(255, 255, 255, 0.1);
      margin: 0px -15px;
    }

    .table-container {
      height: 300px;
      overflow-y: auto;
      margin-right: -7px;

      --background-color: var(--popover-background-color);
      --section-background-color: rgba(255, 255, 255, 0.05);
      --separator-color: rgba(255, 255, 255, 0.1);

      --highlighted-text-color: var(--blue-thin-color);

      ::-webkit-scrollbar-track {
        margin-block-end: 10px;
        margin-block-start: 35px;
      }
    }

    .empty-list {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      h5 {
        margin: 0;
        font-size: 1em;
        margin-top: -0.5em;
      }

      button {
        background-color: transparent;

        color: var(--blue-thin-color);
        font-size: 14px;
        border: none;
        transition: color 0.2s;

        &:hover {
          color: var(--blue-thin-color-hover);
        }
      }
    }
  }
}
</style>