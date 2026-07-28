<template>
  <DebugSection title="FloatingTooltip — плавающий тултип" id="floating-tooltip"
    description="PopoverStyled на виртуальной цели: прямоугольник считается из абсолютных координат точки минус текущий скролл, промежуточного элемента в DOM нет."
    source="src/shared/ui/chart/FloatingTooltip.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">anchor</span>
        <select v-model="anchor">
          <option v-for="item in anchors" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">placement</span>
        <select v-model="placement">
          <option :value="null">— по умолчанию для anchor —</option>
          <option v-for="item in placementWithModifiersVariants" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">offset</span>
        <input type="number" v-model.number="offset" step="2">
      </label>

      <label class="debug-control">
        <span class="debug-label">viewportOffset</span>
        <input type="number" v-model.number="viewportOffset" step="4">
      </label>

      <label class="debug-control">
        <span class="debug-label">arrowSize</span>
        <input type="number" v-model.number="arrowSize" min="0" max="20">
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">interactive (ломает ховер)</span>
        <input type="checkbox" v-model="interactive">
      </label>

      <label class="debug-control">
        <span class="debug-label">animated</span>
        <input type="checkbox" v-model="animated">
      </label>

      <label class="debug-control" v-if="animated">
        <span class="debug-label">animationOmega</span>
        <input type="range" v-model.number="animationOmega" min="2" max="60" step="1">
        <span class="debug-value">{{ animationOmega }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">зум колесом</span>
        <input type="checkbox" v-model="zoom">
      </label>

      <label class="debug-control">
        <span class="debug-label">position</span>
        <select v-model="pointPosition">
          <option v-for="item in pointPositions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </div>

    <DemoChartView :chart="chart" :height="260" />

    <FloatingTooltip :ctx="chart.tooltipCtx.value" :anchor="anchor" :placement="placement ?? undefined" :offset="offset"
      :viewport-offset="viewportOffset" :arrow-size="arrowSize" :interactive="interactive" :animated="animated"
      :animation-omega="animationOmega">
      <template #default="{ ctx }">
        <TooltipCard :ctx="ctx" />
      </template>
    </FloatingTooltip>

    <p class="debug-hint">
      Значения <span class="debug-value">anchor</span>: <span class="debug-value">pivot</span> — точка данных,
      <span class="debug-value">cursor</span> — указатель, <span class="debug-value">pivot-x</span> — вертикальная
      линия во всю высоту графика (тултип встаёт сбоку), <span class="debug-value">pivot-y</span> — горизонтальная во
      всю ширину. У каждого свой placement по умолчанию, поэтому переключение anchor меняет и сторону.
    </p>

    <p class="debug-note">
      Скролл — главная проверка. Зум колесом выключен по умолчанию: наведись на график, не уводя курсор, и прокрути
      страницу колесом. Тултип обязан ехать с точкой пиксель в пиксель, без отставания и без «резинки». Включи
      <span class="debug-value">animated</span> и прокрути ещё раз: сглаживается цель, а не позиция поповера, поэтому
      скролл применяется мгновенно даже с маленьким <span class="debug-value">animationOmega</span> — а вот переход
      между соседними точками при этом плавный. Именно поэтому здесь не CSS-транзишен: он бы анимировал результат и
      превратил скролл в резину.
    </p>

    <p class="debug-note">
      Края экрана: подведи точку к верхней и нижней границе окна — placement должен флипнуться, стрелка переехать на
      другую сторону. <span class="debug-value">viewportOffset</span> задаёт зазор до края;
      поставь 100 и убедись, что карточка держит отступ. <span class="debug-value">arrowSize: 0</span> убирает стрелку,
      но не отступ — за него отвечает <span class="debug-value">offset</span>.
    </p>

    <p class="debug-note">
      Ломающий тумблер <span class="debug-value">interactive</span>: тултип начинает ловить указатель. Подведи курсор
      под саму карточку — ховер на графике оборвётся, тултип спрячется, курсор снова окажется над графиком, и всё
      замигает. Для тултипа, который ездит за курсором, значение по умолчанию
      <span class="debug-value">false</span> — единственно рабочее.
    </p>

    <p class="debug-note">
      Пальцем: удержание показывает карточку рядом с пальцем — проверь, что она не оказывается прямо под пальцем
      (anchor <span class="debug-value">cursor</span> + placement <span class="debug-value">top</span> — как раз тот
      случай, когда её не видно). Прокрути страницу пальцем с открытым тултипом: во время инерционного скролла
      карточка не должна отставать.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, ref, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import { placementWithModifiersVariants, PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import DemoChartView from '../shared/DemoChartView.vue'
import TooltipCard from '../shared/TooltipCard.vue'
import { DemoChart, type PointPosition } from '../shared/DemoChart'

const anchors = [
  { value: 'pivot', label: 'pivot' },
  { value: 'cursor', label: 'cursor' },
  { value: 'pivot-x', label: 'pivot-x' },
  { value: 'pivot-y', label: 'pivot-y' },
] as const

const pointPositions = ['data-point-x', 'data-point-y', 'data-point', 'nearest-data-point'] as const satisfies readonly PointPosition[]

const anchor = ref<typeof anchors[number]['value']>('pivot')
const placement = ref<PlacementWithModifiers | null>(null)
const offset = ref(10)
const viewportOffset = ref(8)
const arrowSize = ref(7)
const interactive = ref(false)
const animated = ref(false)
const animationOmega = ref(30)
const zoom = ref(false)
const pointPosition = ref<PointPosition>('data-point-x')

const chart = markRaw(new DemoChart())
chart.setSeries([syntheticSeries('smooth', 13, 40)])

watchEffect(() => chart.setZoom({
  zoom: zoom.value,
  panDirection: 'horizontal',
  autoFitFollow: true,
}))

watchEffect(() => chart.setHover({ pointPosition: pointPosition.value }))

</script>
