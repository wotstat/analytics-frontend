<template>
  <DebugSection title="Делегат" id="delegate"
    description="Единственный вход в таблицу: обязательных методов четыре, остальные опциональны. Счётчики считают настоящие вызовы — сравни их с числом строк на экране, и станет видно, что каждая строка создаётся дважды."
    source="src/shared/uiKit/tableView/tableView/TableView.ts">

    <table class="debug-table">
      <thead>
        <tr>
          <th>метод</th>
          <th>обяз.</th>
          <th>что решает</th>
          <th>сколько вызовов</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>onSetupComplete</th>
          <td class="false">нет</td>
          <td>единственное место, где страница получает сам объект <span class="debug-value">TableView</span>:
            регистрация пулов, сохранение ссылки на движок</td>
          <td>1 раз, из конструктора</td>
        </tr>
        <tr>
          <th>numberOfSections</th>
          <td class="true">да</td>
          <td>сколько секций</td>
          <td>1 на пересчёт</td>
        </tr>
        <tr>
          <th>numberOfRowsInSection</th>
          <td class="true">да</td>
          <td>сколько строк в секции</td>
          <td>1 на секцию на пересчёт</td>
        </tr>
        <tr>
          <th>heightForCellByIndex</th>
          <td class="true">да</td>
          <td>высота строки в пикселях; браузер её не измеряет, а берёт отсюда</td>
          <td>по разу на <b>каждую</b> строку набора на пересчёт</td>
        </tr>
        <tr>
          <th>cellForIndex</th>
          <td class="true">да</td>
          <td>DOM-строка: либо сам объект, либо <span class="debug-value">{ cell, reusableKey }</span> — с ключом
            строка вернётся в пул</td>
          <td>2 на каждую появившуюся строку</td>
        </tr>
        <tr>
          <th>heightForHeaderInSection</th>
          <td class="false">нет</td>
          <td>высота заголовка секции; <span class="debug-value">null</span> и 0 равнозначны</td>
          <td>1 на секцию на пересчёт</td>
        </tr>
        <tr>
          <th>headerCellForSection</th>
          <td class="false">нет</td>
          <td>элемент заголовка; <span class="debug-value">null</span> — секция без шапки</td>
          <td>2 на каждую появившуюся секцию</td>
        </tr>
        <tr>
          <th>heightForFooterInSection</th>
          <td class="false">нет</td>
          <td>высота футера секции</td>
          <td>1 на секцию на пересчёт</td>
        </tr>
        <tr>
          <th>footerCellForSection</th>
          <td class="false">нет</td>
          <td>элемент футера; <span class="debug-value">null</span> — без футера</td>
          <td>2 на каждую появившуюся секцию</td>
        </tr>
        <tr>
          <th>onScrollVelocityChange</th>
          <td class="false">нет</td>
          <td>скорость прокрутки в px/с со знаком; в конце прокрутки приходит ровно 0</td>
          <td>каждый кадр прокрутки</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">показать фолбэк-слой</span>
        <input type="checkbox" v-model="showFallback">
      </label>
      <button class="debug-btn" @click="resetCounters">Сбросить счётчики</button>
      <span class="debug-hint">скорость: <span class="debug-value">{{ Math.round(shown.velocity) }} px/с</span></span>
    </div>

    <div class="demo-layout">
      <div class="debug-stage table-stage" :class="{ 'show-fallback': showFallback }">
        <TableView :delegate background-color="#2a2a2a" />
      </div>

      <table class="debug-table calls">
        <thead>
          <tr>
            <th>метод</th>
            <th>вызовов</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in callRows" :key="row.title">
            <th>{{ row.title }}</th>
            <td>{{ row.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="debug-note">
      Внутри таблицы два независимых DOM-дерева: <span class="debug-value">.scroll</span> — настоящий скролл, и
      <span class="debug-value">.fallback-scroll</span> — копия под ним (<span class="debug-value">z-index: -2</span>,
      без событий указателя), которую двигают отрицательным <span class="debug-value">margin-top</span>. Поэтому
      <span class="debug-value">cellForIndex</span>, <span class="debug-value">headerCellForSection</span> и
      <span class="debug-value">footerCellForSection</span> зовутся <b>по два раза</b> на каждый появившийся элемент и
      обязаны каждый раз отдавать <b>новый</b> экземпляр: если вернуть один и тот же объект, его DOM-узел просто
      переедет во второй слой. Тумблер выше убирает фон у слоя прокрутки и сдвигает копию вправо — видно обе.
    </p>

    <p class="debug-note">
      В документации это нигде не записано, но набор обязателен целиком:
      <span class="debug-value">numberOfSections</span>, <span class="debug-value">numberOfRowsInSection</span>,
      <span class="debug-value">heightForCellByIndex</span>, <span class="debug-value">cellForIndex</span>. Высоты
      объявляет делегат — таблица ничего не измеряет, поэтому объявленное число обязано совпадать с реальной
      CSS-высотой элемента (см. <a href="#edge-cases">крайние случаи</a>).
    </p>

    <p class="debug-note">
      Ссылку на движок отдаёт <span class="debug-value">onSetupComplete</span> — и она же лежит в
      <span class="debug-value">reusableTable</span> у Vue-обёртки. Отдаётся она геттером: движок появляется только в
      <span class="debug-value">onMounted</span>, а обычным полем в <span class="debug-value">defineExpose</span> туда
      снимался <span class="debug-value">null</span>, снятый до монтирования. До монтирования там по-прежнему
      <span class="debug-value">null</span>, так что всё остальное — <span class="debug-value">registerReusable</span>,
      <span class="debug-value">getReusable</span>, <span class="debug-value">getCellInstancesForIndexPath</span> —
      в момент настройки по-прежнему удобнее брать из <span class="debug-value">onSetupComplete</span>.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, onUnmounted, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import type { TableView as TableViewEngine, TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import { HeaderLine } from '@/shared/uiKit/tableView/tableView/default/HeaderLine'
import { FooterLine } from '@/shared/uiKit/tableView/tableView/default/FooterLine'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { RowCell } from '../shared/RowCell'

const ROW_HEIGHT = 30
const SECTIONS = [
  { title: 'Секция 1', from: 0, count: 40 },
  { title: 'Секция 2', from: 40, count: 60 },
]

const rows = syntheticTableRows(100, 7)

const showFallback = ref(false)

// Обычный объект, а не ref: делегат зовут из rAF десятки раз в секунду, реактивность
// тут только мешала бы. В шаблон значения попадают опросом.
const counters = {
  setup: 0,
  sections: 0,
  rowsInSection: 0,
  cellHeight: 0,
  cell: 0,
  headerHeight: 0,
  header: 0,
  footerHeight: 0,
  footer: 0,
  velocity: 0,
  velocityCalls: 0,
}

const shown = ref({ ...counters })
const timer = setInterval(() => shown.value = { ...counters }, 250)

const callRows = computed(() => [
  { title: 'onSetupComplete', value: shown.value.setup },
  { title: 'numberOfSections', value: shown.value.sections },
  { title: 'numberOfRowsInSection', value: shown.value.rowsInSection },
  { title: 'heightForCellByIndex', value: shown.value.cellHeight },
  { title: 'cellForIndex', value: shown.value.cell },
  { title: 'heightForHeaderInSection', value: shown.value.headerHeight },
  { title: 'headerCellForSection', value: shown.value.header },
  { title: 'heightForFooterInSection', value: shown.value.footerHeight },
  { title: 'footerCellForSection', value: shown.value.footer },
  { title: 'onScrollVelocityChange', value: shown.value.velocityCalls },
])

let instance: TableViewEngine | null = null

const delegate: TableViewDelegate = markRaw({

  onSetupComplete: table => {
    counters.setup += 1
    instance = table
    table.registerReusable(RowCell.reusableKey, () => new RowCell(), 40)
    table.registerReusable(HeaderLine.reusableKey, () => new HeaderLine())
    table.registerReusable(FooterLine.reusableKey, () => new FooterLine())
  },

  numberOfSections: () => {
    counters.sections += 1
    return SECTIONS.length
  },

  numberOfRowsInSection: (_, section) => {
    counters.rowsInSection += 1
    return SECTIONS[section].count
  },

  heightForCellByIndex: () => {
    counters.cellHeight += 1
    return ROW_HEIGHT
  },

  cellForIndex: (table, index) => {
    counters.cell += 1
    const cell = table.getReusable<RowCell>(RowCell.reusableKey)
    cell.configure({ row: rows[SECTIONS[index.section].from + index.row], index, height: ROW_HEIGHT })
    return { cell, reusableKey: RowCell.reusableKey }
  },

  heightForHeaderInSection: () => {
    counters.headerHeight += 1
    return 26
  },

  headerCellForSection: (table, section) => {
    counters.header += 1
    const header = table.getReusable<HeaderLine>(HeaderLine.reusableKey)
    header.setTitle(SECTIONS[section].title)
    return { header, reusableKey: HeaderLine.reusableKey }
  },

  heightForFooterInSection: () => {
    counters.footerHeight += 1
    return 22
  },

  footerCellForSection: (table, section) => {
    counters.footer += 1
    const footer = table.getReusable<FooterLine>(FooterLine.reusableKey)
    footer.setTitle(`строк: ${SECTIONS[section].count}`)
    return { footer, reusableKey: FooterLine.reusableKey }
  },

  onScrollVelocityChange: (_, velocity) => {
    counters.velocity = velocity
    counters.velocityCalls += 1
  },
})

function resetCounters() {
  for (const key of Object.keys(counters) as (keyof typeof counters)[]) counters[key] = 0
  shown.value = { ...counters }
}

onUnmounted(() => {
  clearInterval(timer)
  instance = null
})

</script>


<style scoped lang="scss">
@use '../shared/fallbackLayer.scss' as *;

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

  &.show-fallback {
    @include fallback-layer-visible;
  }
}

.calls {
  th {
    text-align: left;
    font-family: var(--debug-mono);
    font-size: 11px;
  }
}
</style>
