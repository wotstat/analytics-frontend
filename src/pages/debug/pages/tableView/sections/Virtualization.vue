<template>
  <DebugSection title="Виртуализация" id="virtualization"
    description="Сколько бы строк ни было в наборе, в документе живут только видимые. Счётчики DOM берутся из настоящего документа, а не из внутреннего состояния таблицы — это и есть доказательство."
    source="src/shared/uiKit/tableView/tableView/TableView.ts">

    <div class="debug-row">
      <span class="debug-label">строк:</span>
      <button class="debug-btn" v-for="count in rowCounts" :key="count" :class="{ active: rowCount === count }"
        @click="setCount(count)">
        {{ formatInt(count) }}
      </button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">высота строки</span>
        <input type="number" v-model.number="rowHeight" min="16" max="80" step="2" @change="rebuild">
      </label>

      <label class="debug-control">
        <span class="debug-label">мерить кадры</span>
        <input type="checkbox" v-model="measureFrames">
      </label>

      <button class="debug-btn" @click="rebuild">Пересобрать</button>
      <button class="debug-btn" @click="scrollToRow(0)">В начало</button>
      <button class="debug-btn" @click="scrollToLast">В конец</button>
      <button class="debug-btn" @click="scrollSmoothToMiddle">В середину плавно</button>
    </div>

    <div class="demo-layout">
      <div class="debug-stage table-stage" ref="stage">
        <TableView ref="table" :delegate background-color="#2a2a2a" />
      </div>

      <table class="debug-table">
        <thead>
          <tr>
            <th>показатель</th>
            <th>значение</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>строк в наборе</th>
            <td>{{ formatInt(build.rows) }}</td>
          </tr>
          <tr>
            <th>генерация данных</th>
            <td>{{ formatMs(build.generate) }}</td>
          </tr>
          <tr>
            <th>пересчёт высот, dataDidUpdate</th>
            <td>{{ formatMs(build.update) }}</td>
          </tr>
          <tr>
            <th>объявленная высота контента</th>
            <td>{{ formatInt(stats.declaredHeight) }} px</td>
          </tr>
          <tr>
            <th>фактическая область прокрутки</th>
            <td :class="heightsMatch ? 'true' : 'false'">{{ formatInt(stats.scrollHeight) }} px</td>
          </tr>
          <tr>
            <th>строк в слое прокрутки</th>
            <td>{{ stats.scrollCells }}</td>
          </tr>
          <tr>
            <th>строк в фолбэк-слое</th>
            <td>{{ stats.fallbackCells }}</td>
          </tr>
          <tr>
            <th>секций в DOM</th>
            <td>{{ stats.sections }}</td>
          </tr>
          <tr>
            <th>узлов внутри таблицы</th>
            <td>{{ formatInt(stats.tableNodes) }}</td>
          </tr>
          <tr>
            <th>узлов в документе</th>
            <td>{{ formatInt(stats.documentNodes) }}</td>
          </tr>
          <tr>
            <th>кадр, среднее</th>
            <td :class="frameClass">{{ measureFrames ? formatMs(average) : '—' }}</td>
          </tr>
          <tr>
            <th>кадр, максимум</th>
            <td :class="frameClass">{{ measureFrames ? formatMs(worst) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="debug-note">
      <b>Две регрессионные проверки прокрутки.</b> Здесь чинили два бага, и оба видны прямо в этой секции — если
      что-то из них вернётся, смотреть надо сюда.
    </p>

    <p class="debug-note">
      <b>Разгон.</b> Сдвиг видимого окна меняет геометрию контента, браузер считал это изменением выше вьюпорта и
      «компенсировал» правкой <span class="debug-value">scrollTop</span> — та вызывала новый сдвиг, и петля разгоняла
      сама себя: один тик колеса уносил список до конца. Лечение — <span class="debug-value">overflow-anchor:
        none</span>
      у слоя прокрутки. Проверка: навести курсор и крутануть колесо один раз на минимальный тик — прокрутка должна быть
      равна тику, а не уехать в конец.
    </p>

    <p class="debug-note">
      <b>Пустота после последней строки.</b> Сдвиг задавался <span class="debug-value">margin-top</span> у контейнера
      строк, то есть внешним отступом в потоке, и этот отступ добавлялся к области прокрутки: после последней строки
      оставалась пустота во всю величину сдвига — до половины всего скролла. Теперь контейнер позиционирован абсолютно
      и сдвигается через <span class="debug-value">top</span>. Проверка: строка «фактическая область прокрутки» должна
      совпадать с объявленной высотой на любой позиции и любом размере набора, включая 500 000.
    </p>

    <p class="debug-note">
      Почему это долго не замечали: величина сдвига ограничена высотой секции, а на боевых страницах секции мелкие
      (в селекторе техники сдвиг доходил до 805 px при списке 40 856 px). Здесь же секция одна на весь набор, поэтому
      пустота равнялась всей высоте списка. Конфигурация при этом законная — обязательных методов делегата четыре,
      шапки и секций среди них нет.
    </p>

    <p class="debug-note">
      Заодно это лечило и 500 000 строк: удвоенные 30 000 000 px упирались в предел браузера
      <span class="debug-value">2^24 = 16 777 216</span>, диапазон прокрутки расходился с контентом полностью и
      последняя строка оказывалась на 1,7 млн px выше экрана. Сейчас 15 000 000 в предел укладываются и последняя строка
      достижима — но помни, что запас есть не бесконечный: при высоте строки 60 px предел упирается уже около
      280 000 строк.
    </p>

    <p class="debug-note">
      Строк в DOM ровно столько, сколько влезает на экран, — и поровну в двух слоях (см.
      <a href="#delegate">делегат</a>). Запаса нет вообще: строка создаётся ровно в тот момент, когда её край
      появляется в области видимости, и уничтожается сразу, как только уходит. Поэтому на медленных строках при
      быстрой прокрутке видна пустота — под неё и сделан фолбэк-слой с
      <span class="debug-value">onScrollVelocityChange</span> (потребители на быстрой прокрутке отключают тяжёлые
      части строки, см. <span class="debug-path">vehicleSelector/VehicleTable.vue</span>).
    </p>

    <p class="debug-note">
      Построение линейно по числу строк: <span class="debug-value">heightForCellByIndex</span> зовётся для каждой
      строки набора, и рядом заполняются четыре массива на N элементов, включая объект
      <span class="debug-value">{ section, row }</span> на каждую строку. 500 000 строк — это сотни мегабайт и
      заметная пауза, причём пауза повторяется на <b>каждый</b> <span class="debug-value">dataDidUpdate</span>.
    </p>

    <p class="debug-note">
      Включи «мерить кадры» и прокрути таблицу на 1k, потом на 500k. Время кадра держится: интервал видимых строк и
      секций ищется двоичным поиском (<span class="debug-value">getVisibleRowsInterval</span> и
      <span class="debug-value">getVisibleSectionsInterval</span> — оба через
      <span class="debug-value">firstIndexWhere</span>), а не полным перебором, как было раньше. Работает это только
      потому, что смещения монотонны: предикат обязан быть вида «false … false true … true».
    </p>

    <p class="debug-note">
      Пальцем: на 100k+ инерционная прокрутка на iOS едет на композиторе, а строки досоздаются в основном потоке —
      проверять надо именно резкий флик, а не медленное перетаскивание. Тогда же должен быть виден фолбэк-слой в
      виде подложки без текста.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import type { TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import type { ComponentInstance } from '@/shared/utils/types/ComponentInstance'
import type { TableRow } from '@/pages/debug/shared/fixtures/types'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { RowCell } from '../shared/RowCell'
import { formatInt, formatMs } from '../shared/format'
import { useTableDomStats } from '../shared/useTableDomStats'
import { useFrameStats } from '../shared/useFrameStats'

const rowCounts = [100, 1_000, 10_000, 100_000, 500_000]

const table = useTemplateRef<ComponentInstance<typeof TableView>>('table')
const stage = useTemplateRef<HTMLElement>('stage')

const rowCount = ref(1_000)
const rowHeight = ref(30)
const measureFrames = ref(false)

// Данные держим вне реактивности: 500k строк в ref — это 500k прокси на ровном месте.
let rows: TableRow[] = []

const build = ref({ rows: 0, generate: 0, update: 0 })

const { stats, refresh } = useTableDomStats(stage)
const { average, worst } = useFrameStats(measureFrames)

const frameClass = computed(() => {
  if (!measureFrames.value) return ''
  return average.value > 20 ? 'false' : 'true'
})

// Расхождение появляется не сразу, а по мере прокрутки, поэтому сверяем на каждом опросе.
const heightsMatch = computed(() => stats.value.declaredHeight === stats.value.scrollHeight)

const delegate: TableViewDelegate = markRaw({

  onSetupComplete: table => table.registerReusable(RowCell.reusableKey, () => new RowCell(), 60),

  numberOfSections: () => 1,
  numberOfRowsInSection: () => rows.length,

  heightForCellByIndex: () => rowHeight.value,
  cellForIndex: (table, index) => {
    const cell = table.getReusable<RowCell>(RowCell.reusableKey)
    cell.configure({ row: rows[index.row], index, height: rowHeight.value })
    return { cell, reusableKey: RowCell.reusableKey }
  },
})

function setCount(count: number) {
  rowCount.value = count
  rebuild()
}

function rebuild() {
  const startGenerate = performance.now()
  rows = syntheticTableRows(rowCount.value, 3)

  const startUpdate = performance.now()
  table.value?.dataDidUpdate()
  const done = performance.now()

  build.value = { rows: rows.length, generate: startUpdate - startGenerate, update: done - startUpdate }
  refresh()
}

function scrollToRow(row: number) {
  if (rows.length === 0) return
  table.value?.scrollTo({ section: 0, row }, 'instant')
}

function scrollToLast() {
  scrollToRow(rows.length - 1)
}

function scrollSmoothToMiddle() {
  if (rows.length === 0) return
  table.value?.scrollTo({ section: 0, row: Math.floor(rows.length / 2) }, 'smooth')
}

onMounted(rebuild)

onUnmounted(() => {
  rows = []
})

</script>


<style scoped lang="scss">
.demo-layout {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(240px, 0.6fr);
  gap: 0.75em;
  align-items: start;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

.table-stage {
  padding: 0.5em;
  height: 360px;
  box-sizing: border-box;
}
</style>
