<template>
  <DebugSection title="Секции" id="sections"
    description="Шесть секций подряд: пустая, из одной строки, без заголовка, длинная, снова пустая и короткая с футером. Смотреть надо на стыки — заголовок, футер и первая строка следующей секции."
    source="src/shared/uiKit/tableView/tableView/Section.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">липкие заголовки</span>
        <input type="checkbox" v-model="sticky">
      </label>

      <label class="debug-control">
        <span class="debug-label">футеры</span>
        <input type="checkbox" v-model="footers" @change="update">
      </label>

      <label class="debug-control">
        <span class="debug-label">grouped-style</span>
        <input type="checkbox" v-model="grouped">
      </label>
    </div>

    <div class="debug-stage table-stage" :class="{ sticky }">
      <TableView ref="table" :delegate :class="{ 'grouped-style': grouped }" background-color="#2a2a2a" />
    </div>

    <p class="debug-note">
      Секция — это тоже переиспользуемый элемент со своим пулом (ключ регистрирует сама таблица, лимит 20). Внутри
      неё три контейнера: заголовок и футер позиционированы абсолютно по краям секции, строки лежат в потоке, а их
      сдвиг внутри частично видимой секции задаётся <span class="debug-value">top</span> у контейнера строк, который
      позиционирован абсолютно.
    </p>

    <p class="debug-note">
      Липкость заголовка компонент не делает. <span class="debug-value">position: sticky</span> и фон под текстом
      дописывает потребитель — тумблер выше добавляет ровно эти две строчки, попробуй выключить и прокрутить: без
      фона сквозь заголовок будут просвечивать строки. Высота, до которой заголовок липнет, ограничена
      <span class="debug-value">header-container</span>: он кончается за высоту первой строки и футера до низа
      секции.
    </p>

    <p class="debug-note">
      Секция без заголовка — это <span class="debug-value">headerCellForSection → null</span> плюс
      <span class="debug-value">heightForHeaderInSection → 0</span> (или <span class="debug-value">null</span>, движок
      их не различает: <span class="debug-value">height || 0</span>). Вернуть элемент, но объявить нулевую высоту,
      можно — заголовок нарисуется поверх первой строки.
    </p>

    <p class="debug-note">
      Пустая секция была слабым местом: <span class="debug-value">Section.setup</span> получал «высоту первой строки»
      по индексу, который у секции без строк указывает на первую строку <b>следующей</b> секции (а «последней» — на
      последнюю строку предыдущей). Высота контейнера заголовка выходила отрицательной или
      <span class="debug-value">NaN</span>, CSS её игнорировал, и у переиспользованной секции оставалось значение от
      прошлого владельца — липкий заголовок пустой секции вёл себя произвольно. Теперь для секции без строк обе высоты
      нулевые, и заголовок липнет ровно на своей высоте.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import type { TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import { HeaderLine } from '@/shared/uiKit/tableView/tableView/default/HeaderLine'
import { FooterLine } from '@/shared/uiKit/tableView/tableView/default/FooterLine'
import type { ComponentInstance } from '@/shared/utils/types/ComponentInstance'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { RowCell } from '../shared/RowCell'

const ROW_HEIGHT = 30
const HEADER_HEIGHT = 33

const scenario = [
  { title: 'Пустая секция: 0 строк', count: 0 },
  { title: 'Одна строка', count: 1 },
  { title: null, count: 6 },
  { title: 'Сто строк', count: 100 },
  { title: 'Ещё одна пустая', count: 0 },
  { title: 'Пять строк', count: 5 },
]

const offsets = scenario.reduce<number[]>((acc, section, index) => {
  acc.push(index === 0 ? 0 : acc[index - 1] + scenario[index - 1].count)
  return acc
}, [])

const rows = syntheticTableRows(scenario.reduce((sum, section) => sum + section.count, 0), 13)

const table = useTemplateRef<ComponentInstance<typeof TableView>>('table')
const sticky = ref(true)
const footers = ref(true)
const grouped = ref(false)

const delegate: TableViewDelegate = markRaw({

  onSetupComplete: table => {
    table.registerReusable(RowCell.reusableKey, () => new RowCell(), 40)
    table.registerReusable(HeaderLine.reusableKey, () => new HeaderLine())
    table.registerReusable(FooterLine.reusableKey, () => new FooterLine())
  },

  numberOfSections: () => scenario.length,
  numberOfRowsInSection: (_, section) => scenario[section].count,

  heightForCellByIndex: () => ROW_HEIGHT,
  cellForIndex: (table, index) => {
    const cell = table.getReusable<RowCell>(RowCell.reusableKey)
    cell.configure({ row: rows[offsets[index.section] + index.row], index, height: ROW_HEIGHT })
    return { cell, reusableKey: RowCell.reusableKey }
  },

  heightForHeaderInSection: (_, section) => scenario[section].title === null ? 0 : HEADER_HEIGHT,
  headerCellForSection: (table, section) => {
    const title = scenario[section].title
    if (title === null) return null

    const header = table.getReusable<HeaderLine>(HeaderLine.reusableKey)
    header.setTitle(`${title} · секция ${section}`)
    return { header, reusableKey: HeaderLine.reusableKey }
  },

  heightForFooterInSection: () => footers.value ? 24 : 0,
  footerCellForSection: (table, section) => {
    if (!footers.value) return null

    const footer = table.getReusable<FooterLine>(FooterLine.reusableKey)
    footer.setTitle(`конец секции ${section}`)
    return { footer, reusableKey: FooterLine.reusableKey }
  },
})

function update() {
  table.value?.dataDidUpdate()
}

</script>


<style scoped lang="scss">
.table-stage {
  padding: 0.5em;
  height: 380px;
  box-sizing: border-box;

  &.sticky :deep(.header-line) {
    position: sticky;
    top: 0;
    background-color: var(--background-color);
  }
}

:deep(.footer-line) {
  height: 24px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  color: #ffffff66;
}
</style>
