<template>
  <DebugSection title="Крайние случаи" id="edge-cases"
    description="Всё, что ломает ховер и зум: пустой набор, одна точка, константа, 100k точек, смена данных под курсором и ресайз контейнера с открытым тултипом."
    source="src/shared/uiKit/chart/universalChart/interaction/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">набор</span>
        <select v-model="kind">
          <option v-for="item in seriesKinds" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">данные меняются каждые 400 мс</span>
        <input type="checkbox" v-model="live">
      </label>

      <label class="debug-control">
        <span class="debug-label">лимиты</span>
        <input type="checkbox" v-model="limited">
      </label>

      <label class="debug-control">
        <span class="debug-label">elastic</span>
        <input type="checkbox" v-model="elastic" :disabled="!limited">
      </label>

      <button class="debug-btn" @click="chart.resetView()">Сбросить область</button>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <input type="range" v-model.number="width" min="200" max="900" step="10">
        <span class="debug-value">{{ width }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">высота</span>
        <input type="range" v-model.number="height" min="80" max="400" step="10">
        <span class="debug-value">{{ height }}px</span>
      </label>
    </div>

    <div class="debug-stage">
      <DemoChartView :chart="chart" :height="height" :width="`${width}px`" />
    </div>

    <FloatingTooltip :ctx="chart.tooltipCtx.value" anchor="pivot">
      <template #default="{ ctx }">
        <TooltipCard :ctx="ctx" />
      </template>
    </FloatingTooltip>

    <div class="debug-row">
      <span class="debug-label">renderBounds</span>
      <span class="debug-value">
        X {{ formatBound(bounds.minX) }} … {{ formatBound(bounds.maxX) }} ·
        Y {{ formatBound(bounds.minY) }} … {{ formatBound(bounds.maxY) }}
      </span>
    </div>

    <p class="debug-note">
      Пустой набор: ховер обязан продолжать работать (автомат живёт), но ни линии, ни маркера, ни тултипа быть не
      должно, и <span class="debug-value">onHide</span> должен приехать ровно один раз. Переключай «Пустой» ↔
      «Гладкая» прямо с курсором на графике — тултип обязан появляться и исчезать без залипания.
    </p>

    <p class="debug-note">
      Одна точка и константа: bounds вырождаются (нулевая ширина или высота), это классический источник деления на
      ноль. Маркер должен встать на точку, зум — не выдавать NaN в renderBounds выше. Для «Одной точки» полезно
      проверить зум колесом: окно схлопывается вокруг единственного X.
    </p>

    <p class="debug-note">
      100k точек: ховер ищет ближайшую точку линейным перебором по всем рядам на каждый кадр. Смотри, не проседает ли
      частота кадров при движении курсора и при пане одновременно с ховером. Под зумом отбрасываются точки вне
      видимой области, поэтому в приближении должно становиться легче, а не тяжелее.
    </p>

    <p class="debug-note">
      Смена данных под курсором: включи «данные меняются» и держи курсор на графике. Ховер обязан следовать за новыми
      данными, а авто-подгонка оси Y — идти синхронно, без анимации: аниматор оси заводится только от ввода, смена
      данных сама по себе его не запускает.
    </p>

    <p class="debug-note">
      Ресайз с открытым тултипом: наведись, открой тултип и тяни ползунки. Тултип обязан переезжать вместе с точкой
      (координаты берутся из свежего кадра графика), а не оставаться в старом месте. То же самое пальцем: удержание +
      поворот экрана.
    </p>

    <p class="debug-note">
      Зум за предел: с лимитами и <span class="debug-value">elastic</span> сопротивление растёт, окно возвращается
      пружиной; без elastic — жёсткий упор. Быстрые жесты: несколько резких бросков подряд не должны копить скорость
      бесконечно, а бросок в упор — отскакивать, а не залипать за границей.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { seriesKinds, syntheticSeries, type SeriesKind } from '@/pages/debug/shared/fixtures/syntheticSeries'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import DemoChartView from '../shared/DemoChartView.vue'
import TooltipCard from '../shared/TooltipCard.vue'
import { DemoChart } from '../shared/DemoChart'
import { seriesExtent } from '../shared/series'
import { formatBound, useChartBounds } from '../shared/useChartBounds'

const kind = ref<SeriesKind>('smooth')
const live = ref(false)
const limited = ref(true)
const elastic = ref(true)
const width = ref(600)
const height = ref(240)
const seed = ref(1)

const chart = markRaw(new DemoChart())
const bounds = useChartBounds(chart)

const series = computed(() => [syntheticSeries(kind.value, seed.value, 120)])

const extent = computed(() => seriesExtent(series.value))
const minX = computed(() => extent.value.minX)
const maxX = computed(() => extent.value.maxX)

useIntervalFn(() => {
  if (live.value) seed.value = (seed.value % 40) + 1
}, 400)

watchEffect(() => chart.setSeries(series.value))

watchEffect(() => {
  const span = maxX.value - minX.value

  chart.setZoom({
    zoom: true,
    panDirection: 'horizontal',
    autoFitFollow: true,
    limits: limited.value
      ? { minX: minX.value, maxX: maxX.value, minDeltaX: Math.max(0.5, span / 40), maxDeltaX: span, elastic: elastic.value }
      : undefined,
  })
})

</script>
