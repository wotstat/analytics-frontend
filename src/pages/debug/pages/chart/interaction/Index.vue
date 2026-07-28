<template>
  <DebugPage title="Интерактив графиков"
    description="Ховер с линиями и маркером, оба вида тултипов, зум и пан с инерцией и лимитами, синхронизация графиков."
    source="src/shared/uiKit/chart/universalChart/interaction/, src/shared/ui/chart/">

    <DebugSection title="Слои и с чего начать" id="layers"
      description="Ввод проходит сверху вниз: DOM-событие → состояние автомата → контроллер → компоненты. Если поведение сломалось, спускайся по таблице, пока не найдёшь слой, который уже ведёт себя правильно.">

      <table class="debug-table">
        <thead>
          <tr>
            <th>слой</th>
            <th>что делает</th>
            <th>секция</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>BaseInteractionController</th>
            <td>невидимый прямоугольник зоны, подписки на pointer / wheel / touch, перевод координат окна в координаты
              графика</td>
            <td><a href="#state-machine">автомат</a></td>
          </tr>
          <tr>
            <th>StateMachine + states/</th>
            <td>какой жест идёт прямо сейчас: ховер, пан, пинч или ожидание распознавания</td>
            <td><a href="#state-machine">автомат</a></td>
          </tr>
          <tr>
            <th>BaseDataSourcedInteractionController</th>
            <td>поиск ближайших точек в подключённых рядах, с кешем на кадр</td>
            <td><a href="#hover-components">ховер</a></td>
          </tr>
          <tr>
            <th>InteractionController</th>
            <td>композиция компонентов: собирает их mayHover / mayPan в одно решение и раздаёт события</td>
            <td><a href="#hover-components">ховер</a></td>
          </tr>
          <tr>
            <th>компоненты</th>
            <td>линии, маркер, ChartTooltip, CallbackComponent — рисуют ховер; ZoomChartComponent — двигает область</td>
            <td><a href="#hover-components">ховер</a>, <a href="#zoom-pan">зум</a></td>
          </tr>
          <tr>
            <th>sync/</th>
            <td>два независимых хаба между графиками: ховер и границы</td>
            <td><a href="#sync">синхронизация</a></td>
          </tr>
          <tr>
            <th>Vue-обёртки</th>
            <td>ChartTooltip отдаёт только координаты и точки, показывают их HeaderTooltip и FloatingTooltip</td>
            <td><a href="#header-tooltip">шапка</a>, <a href="#floating-tooltip">плавающий</a></td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        Общее для всей страницы: движок не Vue-реактивный. Обёртка создаёт экземпляр класса, дальше всё императивно,
        поэтому каждый тумблер здесь — это вызов метода экземпляра из <span class="debug-value">watchEffect</span>.
        Опции переживают смену настроек на лету: <span class="debug-value">updateOptions</span> есть и у
        <span class="debug-value">ZoomChartComponent</span>, и у линий, маркера и тултипа. Компоненты на этой странице
        создаются один раз, а тумблеры лишь подключают их и отключают через
        <span class="debug-value">addComponent</span> / <span class="debug-value">removeComponent</span>.
      </p>

      <p class="debug-note">
        Текущая область (<span class="debug-value">renderBounds</span>) и состояние автомата читаются событиями:
        <span class="debug-value">chart.onAfterRender</span> отдаёт фактические bounds и layout готового кадра, а
        <span class="debug-value">controller.onStateChanged</span> — каждый переход автомата, включая те, что короче
        кадра. Само состояние читается из <span class="debug-value">controller.currentState</span>, а какое оно —
        страница определяет через <span class="debug-value">instanceof</span>: имена классов съедает минификатор, а
        тащить в движок поле-ярлык ради дебага незачем.
        <span class="debug-value">FloatingTooltip</span> телепортируется в
        <span class="debug-value">#popover-root</span> наружу дебаг-обвязки, поэтому карточки тултипов стилизованы
        локально — классы <span class="debug-value">.debug-*</span> до них не достают.
      </p>
    </DebugSection>

    <StateMachineSection />
    <HoverComponents />
    <HeaderTooltipSection />
    <FloatingTooltipSection />
    <ZoomPan />
    <Synchronization />
    <EdgeCases />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import StateMachineSection from './sections/StateMachineSection.vue'
import HoverComponents from './sections/HoverComponents.vue'
import HeaderTooltipSection from './sections/HeaderTooltipSection.vue'
import FloatingTooltipSection from './sections/FloatingTooltipSection.vue'
import ZoomPan from './sections/ZoomPan.vue'
import Synchronization from './sections/Synchronization.vue'
import EdgeCases from './sections/EdgeCases.vue'

</script>
