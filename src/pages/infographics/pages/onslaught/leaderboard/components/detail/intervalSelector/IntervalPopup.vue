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
        <!-- <div class="content">
          <div class="section">
            <h5>Особенные</h5>
            <div class="items">
              <div class="item">Весь сезон</div>
              <div class="item">Эта неделя</div>
              <div class="item">Сегодня</div>
              <div class="item">Вчера</div>
            </div>
          </div>

          <div class="section">
            <h5>Недели</h5>
            <div class="items">
              <div class="item">Неделя 1</div>
              <div class="item">Неделя 2</div>
              <div class="item">Неделя 3</div>
            </div>
          </div>

          <div class="section">
            <h5>Дни</h5>
            <div class="items">
              <div class="item">День 1</div>
              <div class="item">День 2</div>
              <div class="item">День 3</div>
            </div>
          </div>
        </div> -->
      </div>

      <div class="empty-list" v-if="false">
        <h5>Ничего не найдено</h5>
        <button @click="currentSearch = ''">Очистить фильтр</button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import { HeaderLine } from '@/shared/uiKit/tableView/tableView/default/HeaderLine'
import { SelectableCellLine } from '@/shared/uiKit/tableView/tableView/default/SelectableCellLine'
import { TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import { ref } from 'vue'


const props = defineProps<{}>()
const currentSearch = ref('')


const selectedCells = new Set<string>()

const delegate: TableViewDelegate = {

  onSetupComplete: (table) => {
    table.registerReusable(HeaderLine.reusableKey, () => new HeaderLine())
    table.registerReusable(SelectableCellLine.reusableKey, () => new SelectableCellLine(c => {
      if (!c.indexPath) return

      const id = `line-${c.indexPath.section + 1}-${c.indexPath.row + 1}`
      selectedCells.has(id) ? selectedCells.delete(id) : selectedCells.add(id)
      const selected = selectedCells.has(id)

      const cells = table.getCellInstancesForIndexPath<SelectableCellLine>(c.indexPath)
      for (const cell of cells) cell.setSelected(selected)
    }))
  },

  numberOfSections: () => 2,
  numberOfRowsInSection: (_, section) => 20,

  heightForCellByIndex: (_, index) => 35,
  cellForIndex: (table, index) => {
    const cell = table.getReusable<SelectableCellLine>(SelectableCellLine.reusableKey)
    const id = `line-${index.section + 1}-${index.row + 1}`
    cell.configure({
      text: `Линия ${index.section + 1}-${index.row + 1}`,
      selectable: true,
      selected: selectedCells.has(id),
      index: index,
    })

    return { cell, reusableKey: SelectableCellLine.reusableKey }
  },

  heightForHeaderInSection: (_, section) => 35,
  headerCellForSection: (table, section) => {
    const cell = table.getReusable<HeaderLine>(HeaderLine.reusableKey)
    cell.setTitle(`Секция ${section + 1}`)
    return { header: cell, reusableKey: HeaderLine.reusableKey }
  },

  // heightForFooterInSection: (_, section) => sections.length - 1 == section ? 10 : 0,

  // onScrollVelocityChange: (_, velocity) => scrollVelocity.value = velocity
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
        font-size: 0.9em;
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