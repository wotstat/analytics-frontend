<template>
  <DebugSection title="Реактивные параметры в опциях" id="reactive-options"
    description="ref, computed и getter в опциях useTooltip. Открой тултип программно и крути контролы: карточка обязана переезжать и перекрашиваться, а счётчик «жив N мс» — продолжать идти, потому что содержимое не пересоздаётся."
    source="src/shared/uiKit/tooltip/useTooltip.ts">

    <div class="debug-row">
      <PlacementSelect v-model="placement" allow-none />

      <label class="debug-control">
        <span class="debug-label">offset (getter)</span>
        <input type="range" min="0" max="30" v-model.number="offset">
        <span class="debug-value">{{ offset }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">arrowSize (ref)</span>
        <input type="range" min="0" max="16" v-model.number="arrowSize">
        <span class="debug-value">{{ arrowSize }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">class (computed)</span>
        <select v-model="cardClass">
          <option v-for="variant in cardClasses" :key="variant.value" :value="variant.value">{{ variant.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">viewportOffset (ref)</span>
        <input type="range" min="0" max="400" v-model.number="viewportOffset">
        <span class="debug-value">{{ viewportOffset }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">рамка</span>
        <input type="checkbox" v-model="showViewportBox">
      </label>

      <button class="debug-btn" @click="openByPointer(target?.$el)">Открыть программно</button>
      <button class="debug-btn" @click="closeTooltip('reactive')">closeTooltip('reactive')</button>
      <button class="debug-btn" @click="closeByPointer(target?.$el)">Синтетический pointerleave</button>
    </div>

    <div class="debug-stage center short">
      <ReactiveTarget ref="target" label="цель с реактивными опциями" />
    </div>

    <ViewportBox :display="showViewportBox" :offset="viewportOffset" />

    <EventLog :entries="entries" @clear="clear" title="Показы (группа reactive)"
      empty="Открой тултип — записи появятся здесь" />

    <p class="debug-note">
      Реактивны ровно пять параметров: <span class="debug-value">offset</span>,
      <span class="debug-value">placement</span>, <span class="debug-value">arrowSize</span>,
      <span class="debug-value">viewportOffset</span>, <span class="debug-value">class</span> — они читаются через
      <span class="debug-value">toValue</span> в рендере определения, и открытый тултип видит новое значение сразу.
      А <span class="debug-value">delay</span>, <span class="debug-value">hideDelay</span>,
      <span class="debug-value">interactive</span>, <span class="debug-value">touchBehavior</span> читаются один раз
      при вызове <span class="debug-value">useTooltip</span> — ref туда положить не даст даже тип. В docs это не
      разделено.
    </p>

    <p class="debug-note">
      Цель нарочно вынесена в отдельный компонент со статичным пропом: пока он не меняется, Vue не патчит этот
      компонент и хук <span class="debug-value">updated</span> директивы не вызывается. Если положить ту же цель
      прямо в эту секцию, любое движение ползунка пересоздало бы карточку — как в предыдущей секции — и отличить
      «реактивная опция» от «пересоздание» стало бы невозможно.
    </p>

    <p class="debug-note">
      Утяни <span class="debug-value">viewportOffset</span> вправо: сначала карточка перевернётся, потом перестанет
      помещаться вообще — и тултип <b>закроется сам</b> (в логе появится «скрыт»). Это единственное автозакрытие,
      которое есть у тултипа: <span class="debug-value">TooltipRoot</span> слушает у поповера только
      <span class="debug-value">popoverOutsideWindow</span>. Пока границы поджаты, «открыть программно» будет
      открывать и тут же закрывать — в логе появится пара записей на каждое нажатие.
    </p>

    <p class="debug-note">
      Кнопки «открыть программно» — костыль дебаг-страницы: она рассылает элементу настоящие
      <span class="debug-value">pointerenter</span>/<span class="debug-value">pointerleave</span>. Публичного API
      для открытия нет вовсе, а для закрытия есть только
      <span class="debug-value">closeTooltip(group)</span> — и он требует, чтобы у директивы был arg с именем
      группы (здесь <span class="debug-value">v-reactive-tooltip:reactive</span>).
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { closeTooltip } from '@/shared/uiKit/tooltip/tooltip'
import PlacementSelect from '@/pages/debug/shared/PlacementSelect.vue'
import ViewportBox from '@/pages/debug/shared/ViewportBox.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { cardClasses } from '../../shared/cardClasses'
import { closeByPointer, openByPointer } from '../../shared/pointerSimulation'
import { useDisplayedTooltipsLog } from '../../shared/useDisplayedTooltipsLog'
import ReactiveTarget from './ReactiveTarget.vue'
import { arrowSize, cardClass, offset, placement, viewportOffset } from './reactiveTooltip'

const showViewportBox = ref(false)
const target = useTemplateRef<InstanceType<typeof ReactiveTarget>>('target')

const { entries, clear } = useDisplayedTooltipsLog()

</script>
