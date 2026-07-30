<template>
  <DebugPage title="Оси и подписи"
    description="Оси, тики по значениям и по подписям, стратегии автоподписей classic / interval / cell."
    source="src/shared/uiKit/chart/universalChart/axis/, ticks/, labels/">

    <DebugSection title="Из чего собрана ось" id="layers"
      description="Четыре независимых части. Если подписи встали не туда — спускайся по таблице сверху вниз: сначала проверь, какие значения вообще пришли от генератора, потом какой шаг выбрался, и только потом геометрию."
      source="src/shared/uiKit/chart/universalChart/UniversalChart.ts">

      <table class="debug-table">
        <thead>
          <tr>
            <th>часть</th>
            <th>за что отвечает</th>
            <th>секция</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Axis</th>
            <td>линии по границам области данных, четыре стороны, space или full</td>
            <td><a href="#axis-sides">оси</a></td>
          </tr>
          <tr>
            <th>TicksByValues / TicksByLabels</th>
            <td>
              штрихи и сетка: свой список чисел либо уровни от подписей; TicksByLabels — composite, внутри по группе
              на уровень
            </td>
            <td><a href="#ticks">тики</a>, <a href="#tick-levels">уровни</a></td>
          </tr>
          <tr>
            <th>AutoLabels</th>
            <td>перебор шагов до первого непересекающегося, позиционирование по strategy и уровни тиков кадра</td>
            <td>
              <a href="#step-fallback">перебор</a>, <a href="#strategies">стратегии</a>,
              <a href="#interval">interval</a>, <a href="#cell">cell</a>, <a href="#formatting">формат</a>,
              <a href="#label-slots">слоты</a>, <a href="#tick-levels">уровни тиков</a>,
              <a href="#multi-level-labels">этажи подписей</a>
            </td>
          </tr>
          <tr>
            <th>steppedGenerator / arrayGenerator</th>
            <td>какие числа вообще претендуют на подпись</td>
            <td><a href="#generators">генераторы</a></td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        Подписи добавляются как <b>слоты</b> (<span class="debug-value">addSlot</span>), тики и ось — как
        <b>плоты</b> (<span class="debug-value">addPlot</span>). Слоты сначала возвращают чарту свой размер и режут
        область данных, и рисуются они раньше плотов — поэтому <span class="debug-value">TicksByLabels</span> успевает
        увидеть свежие значения подписей в том же кадре. Порядок внутри одной группы — это ещё и z-order.
      </p>

      <p class="debug-note">
        Тиков движок не красит: у <span class="debug-value">.tick</span> в
        <span class="debug-value">universalChart/style.scss</span> нет ни stroke, ни толщины — без стилей страницы
        элементы есть в DOM, но не видны. Рамку области и оси по значению он красит через
        <span class="debug-value">currentColor</span>. Спорить со специфичностью движка не нужно: весь его
        <span class="debug-value">style.scss</span> лежит в <span class="debug-value">@layer ui-kit-chart</span>, а
        правило страницы вне слоя перебивает слой независимо от специфичности. Поэтому в ChartStage.vue селекторы
        самые короткие — <span class="debug-value">.plot-area-border path</span> — и этого достаточно.
        У <span class="debug-value">.label</span>
        <span class="debug-value">fill</span> и <span class="debug-value">text-anchor</span> действуют только внутри
        группы <span class="debug-value">.labels</span>: добавь подписи без пути
        <span class="debug-value">'labels'</span> — они окажутся чёрными и прижатыми влево, а служебная probe-подпись
        перестанет быть скрытой. Все графики страницы собраны с путями <span class="debug-value">'labels'</span> и
        <span class="debug-value">'ticks'</span>, оттенки — в ChartStage.vue.
      </p>

      <p class="debug-note">
        Движок не Vue-реактивный, но перерисовку заказывает сам:
        <span class="debug-value">AutoLabels.updateOptions</span> и <span class="debug-value">TicksByValues.setTicks</span>
        зовут <span class="debug-value">dataDidChange</span> внутри. Структурное (стороны осей, тип тиков, слот подписей,
        клип) по-прежнему задаётся в конструкторе рендерера — но менять состав чарта можно на живую:
        <span class="debug-value">removePlot</span> / <span class="debug-value">removeSlot</span> /
        <span class="debug-value">removeDefs</span>.
      </p>
    </DebugSection>

    <AxisSides />
    <LabelSlots />
    <TicksVariants />
    <TickLevels />
    <MultiLevelLabels />
    <StepFallback />
    <Strategies />
    <IntervalStrategy />
    <CellStrategy />
    <Generators />
    <Formatting />
    <EdgeCases />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import AxisSides from './sections/AxisSides.vue'
import LabelSlots from './sections/LabelSlots.vue'
import TicksVariants from './sections/TicksVariants.vue'
import TickLevels from './sections/TickLevels.vue'
import MultiLevelLabels from './sections/MultiLevelLabels.vue'
import StepFallback from './sections/StepFallback.vue'
import Strategies from './sections/Strategies.vue'
import IntervalStrategy from './sections/IntervalStrategy.vue'
import CellStrategy from './sections/CellStrategy.vue'
import Generators from './sections/Generators.vue'
import Formatting from './sections/Formatting.vue'
import EdgeCases from './sections/EdgeCases.vue'

</script>
