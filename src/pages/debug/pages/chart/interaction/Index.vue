<template>
  <DebugPage title="Интерактив графиков"
    description="Ввод, курсорные overlay и кадр интерактива: два прохода по компонентам, controller-owned local input, зум и пан рядом."
    source="src/shared/uiKit/chart/universalChart/interaction/">

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
            <th>InteractionController</th>
            <td>хранит local input, собирает mayHover / mayPan компонентов в одно решение и проводит кадр интерактива в
              две фазы</td>
            <td><a href="#cursor-lines">курсор</a></td>
          </tr>
          <tr>
            <th>core/</th>
            <td>identity, geometry, hit, resolver и кадр с memo по паре (resolver, input); selections immutable и живут
              между кадрами, их результаты — нет</td>
            <td><a href="#cursor-without-data">без данных</a></td>
          </tr>
          <tr>
            <th>plot-owned sources</th>
            <td>плот владеет своей геометрией и отдаёт осмысленные для себя запросы: у линии это
              line.interaction.nearestByAxis() по исходным точкам и line.interaction.nearStroke() по фактически
              отрисованной centerline, с семплированием, закешированным в самом плоте по строке d; у столбцов —
              bar.interaction.contains() по layout-прямоугольникам, которые считает и рисует одна и та же математика
              плота; у маркеров — scatter.interaction.nearestPoint() по visual radius, который считается из данных,
              а не из атрибута r в DOM; у полигона — polygon.interaction.contains() по нативному
              SVGPathElement.isPointInFill(), без собственной point-in-polygon математики</td>
            <td><a href="#line-points">точки линии</a>, <a href="#line-point-edges">крайние случаи</a>,
              <a href="#near-stroke">stroke</a>, <a href="#grouped-bar">grouped</a>,
              <a href="#stacked-bar">stacked</a>, <a href="#scatter">scatter</a>, <a href="#polygon">polygon</a></td>
          </tr>
          <tr>
            <th>операции selections</th>
            <td>union, within, orElse, nearest и topmost собирают из запросов одну композицию; порядок результата
              задаёт порядок строк тултипа</td>
            <td><a href="#selection-composition">композиция</a></td>
          </tr>
          <tr>
            <th>компоненты</th>
            <td>VerticalLine, HorizontalLine и MarkerOverlay рисуют по selection; ChartTooltip публикует typed context;
              ZoomChartComponent двигает область; CallbackComponent отдаёт события наружу</td>
            <td><a href="#cursor-lines">курсор</a>, <a href="#tooltip-lines">тултип</a>, <a href="#zoom-pan">зум</a>
            </td>
          </tr>
          <tr>
            <th>Highlight</th>
            <td>единый класс модифицирует существующие SVG-elements через diff previous/current target set;
              ChartTooltip.exposeHighlights публикует его snapshot того же кадра, а isHighlighted() сопоставляет
              identity направленно, не пересечением DOM-targets</td>
            <td><a href="#highlight">Highlight и exposeHighlights</a></td>
          </tr>
          <tr>
            <th>VerticalArea/HorizontalArea</th>
            <td>xRange/yRange на всю высоту/ширину layout; geometry-опция выбирает именованный scope хита (bar
              'group'), сама не считает bar layout и не строит polygon bounds; одна область на уникальный range</td>
            <td><a href="#grouped-bar">item/group на bar</a>, <a href="#polygon">bounds на polygon</a>,
              <a href="#mixed-chart">сборный график</a></td>
          </tr>
          <tr>
            <th>кадр и инвалидация</th>
            <td>смена данных плота и removePlot() при неподвижном курсоре, removeComponent() из колбэка тултипа во
              время render-фазы</td>
            <td><a href="#frame-invalidation">кадр и инвалидация</a></td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        Кадр интерактива идёт двумя проходами по одному снимку списка компонентов:
        <span class="debug-value">prepareInteraction</span> разрешает selections и не трогает DOM,
        <span class="debug-value">renderInteraction</span> обновляет DOM и публикует наружу. Барьер между фазами нужен,
        чтобы потребители видели согласованное состояние кадра независимо от порядка
        <span class="debug-value">addComponent</span>. Снимок нужен потому, что render-фаза пишет во Vue-ref, а оттуда
        может прилететь <span class="debug-value">removeComponent</span> прямо посреди кадра.
      </p>

      <p class="debug-note">
        Общее для всей страницы: движок не Vue-реактивный. Обёртка создаёт экземпляр класса, дальше всё императивно,
        поэтому каждый тумблер здесь — это вызов метода экземпляра из <span class="debug-value">watchEffect</span>.
        Компоненты создаются один раз, тумблеры лишь подключают их и отключают через
        <span class="debug-value">addComponent</span> / <span class="debug-value">removeComponent</span>, а опции
        меняются через <span class="debug-value">updateOptions</span> с полной заменой.
      </p>

      <p class="debug-note">
        Порядок добавления в чарт зафиксирован: <span class="debug-value">InteractionController</span> добавляется
        после плотов. Иначе на его кадре SVG и layout-кеши плотов будут от прошлого кадра, и следующие этапы
        (линия по данным, тултип) начнут отставать на кадр.
      </p>
    </DebugSection>

    <StateMachineSection />
    <CursorLines />
    <CursorWithoutData />
    <LinePoints />
    <LinePointEdges />
    <NearStroke />
    <GroupedBar />
    <StackedBar />
    <Scatter />
    <Polygon />
    <Highlight />
    <TooltipLines />
    <SelectionComposition />
    <Synchronization />
    <ZoomPan />
    <FrameInvalidation />
    <MixedChart />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import StateMachineSection from './sections/StateMachineSection.vue'
import CursorLines from './sections/CursorLines.vue'
import CursorWithoutData from './sections/CursorWithoutData.vue'
import LinePoints from './sections/LinePoints.vue'
import LinePointEdges from './sections/linePointEdges/LinePointEdges.vue'
import NearStroke from './sections/NearStroke.vue'
import GroupedBar from './sections/bars/GroupedBar.vue'
import StackedBar from './sections/bars/StackedBar.vue'
import Scatter from './sections/Scatter.vue'
import Polygon from './sections/Polygon.vue'
import Highlight from './sections/Highlight.vue'
import TooltipLines from './sections/TooltipLines.vue'
import SelectionComposition from './sections/SelectionComposition.vue'
import Synchronization from './sections/synchronization/Synchronization.vue'
import ZoomPan from './sections/ZoomPan.vue'
import FrameInvalidation from './sections/FrameInvalidation.vue'
import MixedChart from './sections/MixedChart.vue'

</script>
