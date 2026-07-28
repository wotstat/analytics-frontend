<template>
  <DebugSection title="HeaderTooltip — тултип в шапке" id="header-tooltip"
    description="Тултип живёт в шапке графика и едет за точкой по горизонтали. Элементы шапки, которые он собой накрывает, гаснут — иначе значение читалось бы поверх заголовка."
    source="src/shared/ui/chart/HeaderTooltip.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">hide (общий)</span>
        <select v-model="hide">
          <option v-for="item in hideModes" :key="String(item.value)" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">hideLeft</span>
        <select v-model="hideLeft">
          <option v-for="item in hideModes" :key="String(item.value)" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">hideCenter</span>
        <select v-model="hideCenter">
          <option v-for="item in hideModes" :key="String(item.value)" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">hideRight</span>
        <select v-model="hideRight">
          <option v-for="item in hideModes" :key="String(item.value)" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">xOffset</span>
        <input type="range" v-model.number="xOffset" min="-150" max="150" step="5">
        <span class="debug-value">{{ xOffset }}px</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">широкий тултип</span>
        <input type="checkbox" v-model="wide">
      </label>

      <label class="debug-control">
        <span class="debug-label">узкая колонка</span>
        <input type="checkbox" v-model="narrow">
      </label>
    </div>

    <div class="chart-card" :class="{ narrow }">
      <HeaderTooltip :ctx="chart.tooltipCtx.value" :hide="hide ?? undefined" :hide-left="hideLeft ?? undefined"
        :hide-center="hideCenter ?? undefined" :hide-right="hideRight ?? undefined" :x-offset="xOffset">
        <template #left>
          <h3>Бои по дням</h3>
        </template>

        <template #center>
          <span class="header-chip">центр</span>
        </template>

        <template #right>
          <span class="header-chip">выбор периода</span>
        </template>

        <template #tooltip="{ ctx }">
          <div class="header-tooltip-body" :class="{ wide }">
            <span class="value">{{ ctx.nearestDataPoints[0].yValue.toFixed(0) }}</span>
            <span class="dim">{{ wide ? 'очень длинная подпись точки' : `x ${ctx.nearestDataPoints[0].xValue}` }}</span>
          </div>
        </template>
      </HeaderTooltip>

      <DemoChartView :chart="chart" :height="230" />
    </div>

    <p class="debug-hint">
      Слоты <span class="debug-value">left</span> / <span class="debug-value">center</span> /
      <span class="debug-value">right</span> остаются в потоке даже когда спрятаны — прозрачность и блюр вместо
      display: none, иначе их геометрию нечем было бы мерить для проверки пересечения.
    </p>

    <p class="debug-note">
      На что смотреть: веди курсор от левого края к правому. У левого края гаснет заголовок, у правого — «выбор
      периода», в середине — центральный чип. С <span class="debug-value">широким тултипом</span> накрываются сразу
      два элемента. Режим <span class="debug-value">always</span> у любого слота гасит его на всё время показа тултипа,
      независимо от пересечения; <span class="debug-value">intersect</span> — значение по умолчанию.
    </p>

    <p class="debug-note">
      Границы: тултип упирается в края контейнера и не выезжает наружу — довези курсор до самого края и убедись, что
      карточка встала, а не уползла. <span class="debug-value">xOffset</span> сдвигает её от точки, но упор в край
      остаётся. Включи <span class="debug-value">узкую колонку</span>: в тесном контейнере тултип почти всегда
      пересекается со всем сразу — на мобильной ширине шапка обязана оставаться читаемой.
    </p>

    <p class="debug-note">
      Пальцем: удержание показывает тултип; ведя палец по графику, следи, что шапка гаснет и возвращается без мигания,
      а после отрыва пальца тултип уезжает через fade, не дёргаясь в сторону.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { markRaw, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticSeries } from '@/pages/debug/shared/fixtures/syntheticSeries'
import HeaderTooltip from '@/shared/ui/chart/HeaderTooltip.vue'
import DemoChartView from '../shared/DemoChartView.vue'
import { DemoChart } from '../shared/DemoChart'

const hideModes = [
  { value: null, label: '— по умолчанию —' },
  { value: 'intersect', label: 'intersect' },
  { value: 'always', label: 'always' },
] as const

type HideMode = 'intersect' | 'always' | null

const hide = ref<HideMode>(null)
const hideLeft = ref<HideMode>(null)
const hideCenter = ref<HideMode>(null)
const hideRight = ref<HideMode>(null)
const xOffset = ref(0)
const wide = ref(false)
const narrow = ref(false)

const chart = markRaw(new DemoChart({ hover: { tooltipPivot: 'nearest' } }))
chart.setSeries([syntheticSeries('smooth', 11, 60)])

</script>


<style scoped lang="scss">
.chart-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--debug-border, #ffffff20);
  border-radius: 6px;

  padding: 36px 10px 10px;
  max-width: 100%;
  transition: max-width 0.2s;

  &.narrow {
    max-width: 340px;
  }

  h3 {
    margin: 0 0 8px 0;
    font-size: 15px;
  }
}

.header-chip {
  display: inline-block;
  font-size: 12px;
  color: #ffffffb5;
  border: 1px solid #ffffff20;
  border-radius: 4px;
  padding: 2px 8px;
}

.header-tooltip-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
  white-space: nowrap;

  &.wide {
    padding: 0 20px;
  }

  .value {
    font-size: 18px;
    font-weight: bold;
    color: white;
  }

  .dim {
    font-size: 11px;
    color: #ffffff80;
    font-variant-numeric: tabular-nums;
  }
}
</style>
