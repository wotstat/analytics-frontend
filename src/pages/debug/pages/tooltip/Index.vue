<template>
  <DebugPage title="Тултипы"
    description="Директивы с текстом, произвольное содержимое через useTooltip, поведение на тач-устройствах."
    source="src/shared/ui/tooltip/textTooltip.ts, src/shared/uiKit/tooltip/">

    <DebugSection title="Слои и с чего начать" id="layers"
      description="Всё на странице — один и тот же движок с разной обёрткой. Если что-то сломалось, спускайся по таблице вниз, пока поведение не станет ожидаемым: так видно, чей это слой.">

      <table class="debug-table">
        <thead>
          <tr>
            <th>слой</th>
            <th>что добавляет</th>
            <th>секции</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>defineTooltip()</th>
            <td>ядро: регистрирует шаблон карточки, отдаёт директиву-цель, считает задержки, тач и группы</td>
            <td>
              <a href="#define-tooltip">произвольное содержимое</a>,
              <a href="#modifiers">модификаторы</a>,
              <a href="#open-close">открытие</a>,
              <a href="#touch">тач</a>
            </td>
          </tr>
          <tr>
            <th>useTooltip()</th>
            <td>содержимое — компонент, значение биндинга → пропы, реактивные параметры, valueAdapter</td>
            <td>
              <a href="#use-tooltip">директива из компонента</a>,
              <a href="#reactive-options">реактивные параметры</a>,
              <a href="#value-adapter">valueAdapter</a>
            </td>
          </tr>
          <tr>
            <th>vTooltip (uiKit)</th>
            <td>готовый текстовый тултип: значение — строка или объект с параметрами</td>
            <td><a href="#value-shape">форма значения</a></td>
          </tr>
          <tr>
            <th>vTextTooltip (ui)</th>
            <td>то же + viewportOffset из шапки сайта; именно она зарегистрирована глобально как v-tooltip</td>
            <td><a href="#project-vs-base">проектная и базовая</a></td>
          </tr>
          <tr>
            <th>TooltipRoot</th>
            <td>рисует открытые тултипы через PopoverStyled, закрывает по тапу вне и по «поповер не поместился»</td>
            <td><a href="#viewport-edges">границы viewport</a>, <a href="#touch">тач</a></td>
          </tr>
        </tbody>
      </table>

      <table class="debug-table">
        <thead>
          <tr>
            <th>опция</th>
            <th>дефолт</th>
            <th>что делает</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>delay</th>
            <td>300</td>
            <td>задержка показа; в группе с уже открытым тултипом пропускается, модификатор .instant обнуляет</td>
          </tr>
          <tr>
            <th>hideDelay</th>
            <td>100</td>
            <td>задержка скрытия после ухода указателя с цели</td>
          </tr>
          <tr>
            <th>interactive</th>
            <td>false</td>
            <td>карточка ловит указатель и не закрывается, пока он внутри; включается и модификатором</td>
          </tr>
          <tr>
            <th>interactiveDelay</th>
            <td>300</td>
            <td>сколько есть на то, чтобы довести указатель с цели до карточки</td>
          </tr>
          <tr>
            <th>interactiveHideDelay</th>
            <td>300</td>
            <td>задержка скрытия после ухода указателя из самой карточки</td>
          </tr>
          <tr>
            <th>touchBehavior</th>
            <td>'toggle'</td>
            <td>тап переключает; 'disabled' — тач игнорируется полностью</td>
          </tr>
        </tbody>
      </table>

      <p class="debug-hint">
        У текстовых директив поверх этого заданы <span class="debug-value">arrowSize: 7</span> и
        <span class="debug-value">offset: 7</span>. placement не задан — работает дефолт Popover
        (<span class="debug-value">top-float</span>), viewportOffset у базовой равен 10 из PopoverStyled, у проектной
        приходит из шапки.
      </p>

      <p class="debug-note">
        Тултипы уезжают в <span class="debug-value">#tooltip-root</span> в конце body — это <b>не</b>
        <span class="debug-value">#popover-root</span>: TooltipRoot рендерит карточки на месте
        (<span class="debug-value">teleportTo: null</span>) внутри своего контейнера с z-index 1100. Наружу
        <span class="debug-value">.debug-root</span> классы <span class="debug-value">.debug-*</span> не достают,
        поэтому содержимое карточек стилизовано своими scoped-стилями, а классы для параметра
        <span class="debug-value">class</span> объявлены не-scoped блоком в этом файле.
      </p>

      <p class="debug-note">
        Открытый тултип пересчитывает позицию каждый кадр — десятками их по странице лучше не оставлять. Логи в
        секциях читают одну общую мапу <span class="debug-value">displayedTooltips</span>, так что в них видно и
        тултипы соседних секций.
      </p>

      <p class="debug-note">
        Кнопки «открыть программно» — костыль страницы, а не API: публичного способа открыть тултип из кода нет,
        поэтому странице приходится рассылать элементу синтетические
        <span class="debug-value">pointerenter</span>/<span class="debug-value">pointerleave</span>. Нужны они затем,
        что иначе параметры открытого тултипа не покрутить: убрал указатель — тултип закрылся.
      </p>
    </DebugSection>

    <ProjectVsBase />
    <ValueShape />
    <Modifiers />
    <CustomContent />
    <ComponentDirective />
    <ReactiveOptions />
    <ValueAdapter />
    <OpenClose />
    <ViewportEdges />
    <TouchBehavior />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ProjectVsBase from './sections/ProjectVsBase.vue'
import ValueShape from './sections/ValueShape.vue'
import Modifiers from './sections/Modifiers.vue'
import CustomContent from './sections/customContent/CustomContent.vue'
import ComponentDirective from './sections/componentDirective/ComponentDirective.vue'
import ReactiveOptions from './sections/reactiveOptions/ReactiveOptions.vue'
import ValueAdapter from './sections/valueAdapter/ValueAdapter.vue'
import OpenClose from './sections/OpenClose.vue'
import ViewportEdges from './sections/viewportEdges/ViewportEdges.vue'
import TouchBehavior from './sections/TouchBehavior.vue'

</script>


<!-- Не scoped: класс из параметра class уезжает на карточку в #tooltip-root, наружу .debug-root. -->
<style lang="scss">
.debug-tt-accent {
  --popover-background-color: #101d33;
  --popover-border-color: #283955;
}

.debug-tt-danger {
  --popover-background-color: #2b1618;
  --popover-border-color: #5a2c30;
}
</style>
