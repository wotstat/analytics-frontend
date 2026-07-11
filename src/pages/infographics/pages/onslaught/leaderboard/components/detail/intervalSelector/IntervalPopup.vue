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
import { TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import { computed, ref, watch } from 'vue'

const table = ref<InstanceType<typeof TableView> | null>(null)

const props = defineProps<{
  seasonInterval: { start: Date, end: Date, length: number }
}>()
const currentSearch = ref('')

type Interval = { start: Date, end: Date }

const emit = defineEmits<{
  (e: 'select', value: Interval & { name: string }): void
}>()

const DAY = 24 * 60 * 60 * 1000
const WEEK = 7 * DAY

const startMs = props.seasonInterval.start.getTime()
const endMs = Math.ceil((props.seasonInterval.end.getTime() - startMs) / WEEK) * WEEK + startMs
const now = Date.now()

// сезон ещё идёт
const active = now >= startMs && now < endMs

const totalDays = Math.max(1, Math.ceil((endMs - startMs) / DAY))
const totalWeeks = Math.max(1, Math.ceil((endMs - startMs) / WEEK))

// текущие игровые день/неделя (1-based); могут выйти за пределы сезона, если он закончился
const currentDayIndex = Math.ceil((now - startMs) / DAY)
const currentWeekIndex = Math.ceil((now - startMs) / WEEK)

const todayAvailable = currentDayIndex >= 1 && currentDayIndex <= totalDays
const yesterdayAvailable = currentDayIndex - 1 >= 1 && currentDayIndex - 1 <= totalDays
const thisWeekAvailable = currentWeekIndex >= 1 && currentWeekIndex <= totalWeeks

function dayRange(i: number): Interval {
  return {
    start: new Date(startMs + (i - 1) * DAY),
    end: new Date(Math.min(endMs, startMs + i * DAY)),
  }
}

function weekRange(i: number): Interval {
  return {
    start: new Date(startMs + (i - 1) * WEEK),
    end: new Date(Math.min(endMs, startMs + i * WEEK)),
  }
}

const wholeSeason: Interval = { start: new Date(startMs), end: new Date(endMs) }

type IntervalItem = { text: string } & Interval

const specialItems: IntervalItem[] = []
if (active) {
  if (todayAvailable) specialItems.push({ text: 'Сегодня', ...dayRange(currentDayIndex) })
  if (yesterdayAvailable) specialItems.push({ text: 'Вчера', ...dayRange(currentDayIndex - 1) })
  if (thisWeekAvailable) specialItems.push({ text: 'Эта неделя', ...weekRange(currentWeekIndex) })
  specialItems.push({ text: 'Весь сезон', ...wholeSeason })
} else {
  specialItems.push({ text: 'Весь сезон', ...wholeSeason })
  if (yesterdayAvailable) specialItems.push({ text: 'Вчера', ...dayRange(currentDayIndex - 1) })
}

const visibleWeeks = active ? Math.min(currentWeekIndex, totalWeeks) : totalWeeks
const visibleDays = active ? Math.min(currentDayIndex, totalDays) : totalDays

const fullData = [
  { name: 'Особенные', items: specialItems },
  { name: 'Недели', items: new Array(visibleWeeks).fill(0).map((_, i): IntervalItem => ({ text: `Неделя ${i + 1}`, ...weekRange(i + 1) })) },
  { name: 'Дни', items: new Array(visibleDays).fill(0).map((_, i): IntervalItem => ({ text: `День ${i + 1}`, ...dayRange(i + 1) })) },
]

const grouped = fullData.map(list => ({
  header: list.name,
  items: list.items.map(item => ({
    text: item.text,
    start: item.start,
    end: item.end,
    highlighted: new Highlighted(item.text)
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
      if (!search) return filtered

      return filtered.sort((a, b) => {
        const comp = compareIntervals(a.highlighted.intervals, b.highlighted.intervals)
        if (comp !== 0) return comp
        return a.highlighted.text.localeCompare(b.highlighted.text, undefined, { numeric: true })
      })
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

      const line = sections[c.indexPath.section].lines[c.indexPath.row]
      emit('select', { start: line.start, end: line.end, name: line.text })
    }))
  },

  numberOfSections: () => sections.length,
  numberOfRowsInSection: (_, section) => sections[section].lines.length,

  heightForCellByIndex: (_, index) => 35,
  cellForIndex: (table, index) => {
    const cell = table.getReusable<HighlightedCellLine>(HighlightedCellLine.reusableKey)
    cell.configure({
      text: sections[index.section].lines[index.row].text,
      highlightedText: sections[index.section].lines[index.row].highlighted,
      selectable: true,
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