<template>
  <DebugSection title="Обновление данных" id="data-update"
    description="Единственный способ сообщить таблице, что данные изменились, — dataDidUpdate(). Выключи тумблер и понажимай кнопки: набор уже другой, а таблица об этом не знает. Это ровно та ошибка, которую делают в первый раз."
    source="src/shared/uiKit/tableView/TableView.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">звать dataDidUpdate</span>
        <input type="checkbox" v-model="autoUpdate">
      </label>

      <button class="debug-btn" @click="manualUpdate">Позвать dataDidUpdate вручную</button>
      <span class="debug-hint">строк: <span class="debug-value">{{ rows.length }}</span></span>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="addRows('end')">+10 в конец</button>
      <button class="debug-btn" @click="addRows('start')">+10 в начало</button>
      <button class="debug-btn" @click="removeRows('end')">−10 с конца</button>
      <button class="debug-btn" @click="removeRows('start')">−10 с начала</button>
      <button class="debug-btn" @click="replaceAll">Заменить набор целиком</button>
      <button class="debug-btn" @click="mutateValues">Изменить значения на месте</button>
      <button class="debug-btn" @click="clearRows">Очистить</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">строка</span>
        <input type="number" v-model.number="pointRow" min="0" step="1">
      </label>
      <button class="debug-btn" @click="pointUpdate">Обновить строку точечно</button>
      <span class="debug-hint">без dataDidUpdate, через getCellInstancesForIndexPath</span>
    </div>

    <div class="demo-layout">
      <div class="debug-stage table-stage">
        <TableView ref="table" :delegate background-color="#2a2a2a" />
      </div>

      <EventLog :entries="entries" @clear="clear" title="Операции" empty="Понажимай кнопки выше" />
    </div>

    <p class="debug-note">
      Что должно произойти с выключенным тумблером: количество строк на экране не меняется — высоты, суммарная высота
      контента и границы видимого интервала посчитаны один раз и лежат в массивах внутри таблицы. Но
      <span class="debug-value">cellForIndex</span> зовётся на каждую новую появившуюся строку и читает уже
      <b>новый</b> массив, поэтому при прокрутке набор поедет вперемешку: старые строки остались как были, новые
      приходят из нового массива. Если строк стало меньше — таблица спросит индекс, которого больше нет, и получит
      <span class="debug-value">undefined</span> (тут вместо падения рисуется заглушка).
    </p>

    <p class="debug-note">
      <span class="debug-value">dataDidUpdate()</span> — не «обнови различия», а полный сброс: все видимые строки
      уничтожаются и создаются заново, интервалы обнуляются, высоты пересчитываются для
      <b>всех</b> строк набора. На больших наборах это дорого (см. <a href="#virtualization">виртуализацию</a>),
      поэтому для изменения значения в уже видимой строке он не нужен — хватает точечного обновления. Оно не
      пересчитывает высоты: если изменилась высота строки, без <span class="debug-value">dataDidUpdate</span> не
      обойтись.
    </p>

    <p class="debug-note">
      Прокрутка при <span class="debug-value">dataDidUpdate</span> не сбрасывается: <span class="debug-value">scrollTop
      </span> остаётся, поэтому добавление в начало сдвигает содержимое вниз, а не сохраняет позицию — anchor'а у
      таблицы нет. Если строк стало меньше и <span class="debug-value">scrollTop</span> перестал быть достижимым, его
      ужмёт браузер, а таблица узнает об этом из события прокрутки. Потребители в проекте на такое отвечают
      <span class="debug-value">scrollTo({ section: 0, row: 0 }, 'instant')</span> сразу после
      <span class="debug-value">dataDidUpdate</span>.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, shallowRef, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import type { TableView as TableViewEngine, TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import type { ComponentInstance } from '@/shared/utils/types/ComponentInstance'
import type { TableRow } from '@/pages/debug/shared/fixtures/types'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { RowCell } from '../shared/RowCell'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { useEventLog } from '@/pages/debug/shared/useEventLog'

const ROW_HEIGHT = 30
const START_COUNT = 200

// Заглушка на случай, когда таблица спрашивает строку, которой больше нет.
const missing: TableRow = { id: -1, name: '— строки больше нет —', battles: 0, damage: 0, winrate: 0 }

const table = useTemplateRef<ComponentInstance<typeof TableView>>('table')

const autoUpdate = ref(true)
const pointRow = ref(0)

let seed = 21
let nextId = 0

// shallowRef: массив меняется целиком, а по строкам ходит не Vue, а делегат.
const rows = shallowRef<TableRow[]>(makeRows(START_COUNT))

const { entries, push, clear } = useEventLog()

let instance: TableViewEngine | null = null

function makeRows(count: number) {
  seed += 1
  return syntheticTableRows(count, seed).map(row => ({ ...row, id: nextId++ }))
}

const delegate: TableViewDelegate = markRaw({

  onSetupComplete: table => {
    instance = table
    table.registerReusable(RowCell.reusableKey, () => new RowCell(), 40)
  },

  numberOfSections: () => 1,
  numberOfRowsInSection: () => rows.value.length,

  heightForCellByIndex: () => ROW_HEIGHT,
  cellForIndex: (table, index) => {
    const cell = table.getReusable<RowCell>(RowCell.reusableKey)
    cell.configure({ row: rows.value[index.row] ?? missing, index, height: ROW_HEIGHT })
    return { cell, reusableKey: RowCell.reusableKey }
  },
})

function applied(text: string) {
  if (autoUpdate.value) {
    table.value?.dataDidUpdate()
    push(`${text} → dataDidUpdate`)
    return
  }

  push(`${text} → dataDidUpdate НЕ вызван`)
}

function addRows(where: 'start' | 'end') {
  const added = makeRows(10)
  rows.value = where === 'end' ? [...rows.value, ...added] : [...added, ...rows.value]
  applied(`+10 в ${where === 'end' ? 'конец' : 'начало'}, стало ${rows.value.length}`)
}

function removeRows(where: 'start' | 'end') {
  rows.value = where === 'end' ? rows.value.slice(0, -10) : rows.value.slice(10)
  applied(`−10 с ${where === 'end' ? 'конца' : 'начала'}, стало ${rows.value.length}`)
}

function replaceAll() {
  rows.value = makeRows(START_COUNT)
  applied(`набор заменён целиком, строк ${rows.value.length}`)
}

function mutateValues() {
  // Мутация на месте: ссылка на массив та же, ни один ref не поменялся.
  const count = Math.min(20, rows.value.length)
  for (let i = 0; i < count; i++) {
    const row = rows.value[i]
    row.damage = Math.round(row.damage * 1.1)
    row.winrate = Math.round((row.winrate + 3) * 100) / 100
  }
  applied(`значения первых ${count} строк изменены на месте`)
}

function clearRows() {
  rows.value = []
  applied('набор очищен')
}

function manualUpdate() {
  table.value?.dataDidUpdate()
  push('dataDidUpdate вручную')
}

function pointUpdate() {
  if (!instance) return

  const index = { section: 0, row: pointRow.value }
  const row = rows.value[index.row]
  if (!row) {
    push(`строка ${index.row}: такой строки в наборе нет`)
    return
  }

  row.damage = Math.round(row.damage * 1.25)
  const cells = instance.getCellInstancesForIndexPath<RowCell>(index)
  for (const cell of cells) cell.configure({ row, index, height: ROW_HEIGHT })

  push(`строка ${index.row}: обновлено экземпляров ${cells.length}${cells.length === 0 ? ' (строка не на экране)' : ''}`)
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
  height: 320px;
  box-sizing: border-box;
}
</style>
