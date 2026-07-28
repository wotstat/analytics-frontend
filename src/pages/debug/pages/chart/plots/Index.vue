<template>
  <DebugPage title="Типы графиков"
    description="Линии и сглаживание, заливки, столбцы grouped и stacked, маркеры, прямоугольные области."
    source="src/shared/uiKit/chart/universalChart/plot/">

    <DebugSection title="Рендереры данных и с чего начать" id="renderers"
      description="Каждый рендерер отвечает за одну фигуру и получает данные своим методом. Если сломалось — начни с секции того рендерера, который рисует подозрительное, а не с графика целиком.">

      <table class="debug-table">
        <thead>
          <tr>
            <th>рендерер</th>
            <th>что рисует</th>
            <th>как отдавать данные</th>
            <th>секция</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>AutoLine</th>
            <td>линию и, по желанию, заливку под ней</td>
            <td><span class="debug-value">setPoints(points)</span>, null = разрыв</td>
            <td><a href="#auto-line">сглаживание</a>, <a href="#decimation">децимация</a></td>
          </tr>
          <tr>
            <th>AutoLineArea</th>
            <td>заливку между двумя линиями</td>
            <td><span class="debug-value">setPoints(top, bottom)</span></td>
            <td><a href="#auto-line-area">коридор</a></td>
          </tr>
          <tr>
            <th>Bar</th>
            <td>столбцы, grouped или stacked</td>
            <td><span class="debug-value">setDatasets</span>, <span class="debug-value">setStrategy</span></td>
            <td><a href="#bar-layout">раскладка</a>, <a href="#bar-radius">радиусы</a></td>
          </tr>
          <tr>
            <th>AutoMarkers</th>
            <td>точку на каждое значение</td>
            <td><span class="debug-value">setMarkers</span></td>
            <td><a href="#auto-markers">маркеры</a></td>
          </tr>
          <tr>
            <th>RectangleArea</th>
            <td>один прямоугольник по двум точкам</td>
            <td><span class="debug-value">setPoints(p1, p2)</span></td>
            <td><a href="#rectangle-area">области</a></td>
          </tr>
          <tr>
            <th>PlotGroup</th>
            <td>ничего — держит других под общим клипом или маской</td>
            <td><span class="debug-value">addPlot</span></td>
            <td><a href="#plot-group">группы</a></td>
          </tr>
          <tr>
            <th>defs/*</th>
            <td>градиенты, паттерны, клипы, маски</td>
            <td><span class="debug-value">addDefs</span> + fill / clip / mask</td>
            <td><a href="#gradients">заливки</a>, <a href="#clips">обрезка</a></td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        <b>Движок не реактивный.</b> Vue-обёртка создаёт экземпляр класса, дальше всё императивно: контролы на этой
        странице зовут методы экземпляра из watch и watchEffect, а не передают пропсы. Сами экземпляры —
        <span class="debug-value">markRaw</span>, dispose делает обёртка при размонтировании.
      </p>

      <p class="debug-note">
        <b>Часть опций задаётся только в конструкторе</b> — классы, area, lines, layoutLimited, padding, цель клипа
        и маски. Менять их у живого рендерера нечем, а иногда и опасно (снятая опция оставляет уже нарисованное на
        экране). Поэтому такие контролы пересоздают график целиком; заметки в секциях говорят, где именно и почему.
        Рядом с этим стоит помнить, что <b>удалить рендерер из графика нельзя</b>: remove-методов нет ни у чарта,
        ни у группы.
      </p>

      <p class="debug-note">
        Графики здесь нарочно без осей, подписей и ховера: <a href="/debug/chart/axis">оси и подписи</a> и
        <a href="/debug/chart/interaction">интерактив</a> — на соседних страницах. Область построения там, где надо,
        обведена пунктиром, а цифры под контролами сняты с готового SVG — то есть показывают нарисованное, а не
        задуманное.
      </p>
    </DebugSection>

    <LineSmoothing />
    <Decimation />
    <LineArea />
    <BarsLayout />
    <BarsRadius />
    <Markers />
    <Rectangles />
    <GradientsPatterns />
    <ClipsMasks />
    <PlotGroups />
    <EdgeCases />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import LineSmoothing from './sections/LineSmoothing.vue'
import Decimation from './sections/Decimation.vue'
import LineArea from './sections/LineArea.vue'
import BarsLayout from './sections/BarsLayout.vue'
import BarsRadius from './sections/barsRadius/BarsRadius.vue'
import Markers from './sections/Markers.vue'
import Rectangles from './sections/Rectangles.vue'
import GradientsPatterns from './sections/GradientsPatterns.vue'
import ClipsMasks from './sections/ClipsMasks.vue'
import PlotGroups from './sections/PlotGroups.vue'
import EdgeCases from './sections/EdgeCases.vue'

</script>
