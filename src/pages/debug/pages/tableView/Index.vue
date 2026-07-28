<template>
  <DebugPage title="TableView"
    description="Виртуализированная таблица: секции, переиспользование строк, шапка и футер, выделение."
    source="src/shared/uiKit/tableView/">

    <DebugSection title="Как устроена таблица" id="overview"
      description="Три факта, без которых остальные секции читаются как магия. Если что-то ведёт себя странно — сначала проверь их.">

      <table class="debug-table">
        <thead>
          <tr>
            <th>файл</th>
            <th>роль</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>TableView.vue</th>
            <td>вся Vue-часть: создаёт движок в <span class="debug-value">onMounted</span>, отдаёт наружу
              <span class="debug-value">dataDidUpdate</span> и <span class="debug-value">scrollTo</span>, зовёт
              <span class="debug-value">dispose</span> при размонтировании. Ни одного реактивного поля внутри
            </td>
          </tr>
          <tr>
            <th>tableView/TableView.ts</th>
            <td>движок: считает высоты и смещения, держит интервалы видимых строк и секций, создаёт и убивает строки
              на каждом кадре прокрутки. Здесь же <span class="debug-value">TableViewDelegate</span> и
              <span class="debug-value">IndexPath</span>
            </td>
          </tr>
          <tr>
            <th>tableView/Section.ts</th>
            <td>секция: контейнеры заголовка, футера и строк плюс подложки под липкий заголовок. Тоже
              переиспользуемый элемент</td>
          </tr>
          <tr>
            <th>tableView/ReusableStorage.ts</th>
            <td>пулы свободных DOM-элементов по символьному ключу. Не кеш: всё, что не влезло в лимит,
              выбрасывается</td>
          </tr>
          <tr>
            <th>tableView/default/</th>
            <td>готовые строки: <span class="debug-value">CellLine</span>,
              <span class="debug-value">SelectableCellLine</span>, <span class="debug-value">HeaderLine</span>,
              <span class="debug-value">FooterLine</span>
            </td>
          </tr>
          <tr>
            <th>ui/tableView/cells/HighlightedCell.ts</th>
            <td>строка с подсветкой совпадений поиска, наследник
              <span class="debug-value">SelectableCellLine</span>
            </td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        <b>1. Внутри таблицы нет реактивности.</b> Ядро — обычные классы на голом DOM, Vue-обёртка только создаёт
        экземпляр и передаёт ему <span class="debug-value">delegate</span>. Ни данные, ни высоты, ни число секций
        таблица не отслеживает: любое изменение доезжает только через
        <span class="debug-value">dataDidUpdate()</span> или через точечное обновление уже созданной строки. Проп
        <span class="debug-value">delegate</span> читается один раз при монтировании — подменять его на другой объект
        бессмысленно.
      </p>

      <p class="debug-note">
        <b>2. Строк в DOM ровно столько, сколько видно, и создаются они дважды.</b> Внутри два параллельных дерева:
        настоящий скролл и фолбэк-подложка под ним. Поэтому делегат обязан отдавать новый экземпляр строки на каждый
        вызов, а один и тот же DOM-узел приходит под разные строки — и обязан полностью переписывать своё содержимое.
      </p>

      <p class="debug-note">
        <b>3. Высоты объявляет делегат.</b> Таблица не измеряет ни одну строку. Число из
        <span class="debug-value">heightForCellByIndex</span> — единственная правда для прокрутки, и оно обязано
        совпадать с реальной CSS-высотой элемента.
      </p>

      <p class="debug-note">
        Компоненту нужен родитель с явными размерами: сам он занимает <span class="debug-value">100%</span> по обеим
        осям. Все примеры на странице лежат в контейнерах с заданной высотой.
      </p>
    </DebugSection>

    <Delegate />
    <Virtualization />
    <Reuse />
    <LineTypes />
    <Sections />
    <Highlight />
    <DataUpdate />
    <ScrollTo />
    <Sizing />
    <EdgeCases />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Delegate from './sections/Delegate.vue'
import Virtualization from './sections/Virtualization.vue'
import Reuse from './sections/reuse/Reuse.vue'
import LineTypes from './sections/LineTypes.vue'
import Sections from './sections/Sections.vue'
import Highlight from './sections/Highlight.vue'
import DataUpdate from './sections/DataUpdate.vue'
import ScrollTo from './sections/ScrollTo.vue'
import Sizing from './sections/Sizing.vue'
import EdgeCases from './sections/EdgeCases.vue'

</script>
