<template>
  <section class="time-series-panel" :class="{ compact: density === 'compact', 'with-annotations': annotationLabels }">
    <HeaderTooltip v-if="density === 'compact' || tooltip === 'header'" :ctx="tooltip === 'header' ? chart.tooltipCtx.value : null"
      class="panel-header">
      <template #left><slot name="header" /></template>
      <template #right>
        <ChartToolbar :density>
          <slot name="toolbar" />
          <ToolbarGroup v-if="$slots.actions"><slot name="actions" /></ToolbarGroup>
        </ChartToolbar>
      </template>
      <template #tooltip="{ ctx }">
        <slot name="tooltip" :ctx>
          <TimeSeriesTooltip :ctx :sources="legend.enabled.value" :format-value>
            <template v-if="$slots['tooltip-header']" #header="context">
              <slot name="tooltip-header" v-bind="context" />
            </template>
          </TimeSeriesTooltip>
        </slot>
      </template>
    </HeaderTooltip>
    <ChartToolbar v-else :density class="panel-header">
      <template v-if="$slots.header" #left><slot name="header" /></template>
      <slot name="toolbar" />
      <ToolbarGroup v-if="$slots.actions"><slot name="actions" /></ToolbarGroup>
    </ChartToolbar>

    <div class="panel-content">
      <div class="chart-body">
        <UniversalChartComponent v-show="hasValues" :chart />
        <div v-if="$slots.state" class="chart-state"><slot name="state" /></div>
      </div>
      <div v-if="hasLegend || $slots.details || $slots['legend-actions']" class="panel-details">
        <div v-if="hasLegend" class="legend-row">
          <Legend :legend toggleable highlightable :color-editable :removable
            @color-change="(item, color) => emit('colorChange', item, color)"
            @remove="item => emit('remove', item)" />
          <slot name="legend-actions" />
        </div>
        <slot name="details" />
      </div>
    </div>

    <FloatingTooltip v-if="tooltip === 'floating'" :ctx="chart.tooltipCtx.value" anchor="pivot-x"
      :placement="['top-float', 'bottom-float']" :offset="{ top: 28, bottom: annotationLabels ? 40 : 12 }">
      <template #default="{ ctx }">
        <slot name="tooltip" :ctx>
          <TimeSeriesTooltip :ctx :sources="legend.enabled.value" :format-value>
            <template v-if="$slots['tooltip-header']" #header="context">
              <slot name="tooltip-header" v-bind="context" />
            </template>
          </TimeSeriesTooltip>
        </slot>
      </template>
    </FloatingTooltip>
  </section>
</template>

<script setup lang="ts" generic="TPoint extends TimeSeriesPoint, TItem extends LegendItem & { tag: string }">
import { computed, watch } from 'vue'
import type { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import type { ClickInteractionEvent } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import type { TimeSeriesChart, TimeSeriesHit } from './TimeSeriesChart'
import type { TimeSeriesPoint } from './timeSeries'
import type { LegendItem, LegendModel } from './useLegend'
import ChartToolbar from './ChartToolbar.vue'
import ToolbarGroup from './ToolbarGroup.vue'
import HeaderTooltip from './HeaderTooltip.vue'
import FloatingTooltip from './FloatingTooltip.vue'
import TimeSeriesTooltip from './TimeSeriesTooltip.vue'
import Legend from './Legend.vue'

const props = withDefaults(defineProps<{
  chart: TimeSeriesChart<TPoint>
  legend: LegendModel<TItem>
  hasValues: boolean
  formatValue: (value: number, ctx: TooltipCtx<TimeSeriesHit<TPoint>>) => string
  density?: 'standard' | 'compact'
  tooltip?: 'header' | 'floating'
  showLegend?: boolean
  colorEditable?: boolean
  removable?: boolean
  annotationLabels?: boolean
}>(), {
  density: 'standard',
  tooltip: 'floating',
  showLegend: true,
})

const emit = defineEmits<{
  colorChange: [item: TItem, color: string]
  remove: [item: TItem]
  seriesClick: [payload: { tag: string, event: ClickInteractionEvent }]
}>()

const hasLegend = computed(() => props.showLegend && props.legend.items.value.length > 0)

watch([() => props.chart, () => props.legend.items.value.map(item => ({ tag: item.tag, color: item.color }))],
  ([chart, colors]) => chart.setSeriesColors(colors),
  { immediate: true })

watch(() => props.chart, (chart, _, onCleanup) => {
  onCleanup(chart.onSeriesClick.on(payload => emit('seriesClick', payload)))
}, { immediate: true })
</script>

<style scoped lang="scss">
@use './timeSeriesChart.scss' as *;
@use './timeSeriesAnnotations.scss' as *;

.time-series-panel {
  --time-series-legend-height: 21px;
  --time-series-gap: 12px;
  --time-series-height: calc(clamp(260px, 30vw, 400px) - var(--time-series-legend-height) - var(--time-series-gap));
  min-width: 0;

  .panel-content {
    display: flex;
    flex-direction: column;
    gap: var(--time-series-gap);
    margin-top: 12px;
  }

  .chart-body {
    position: relative;
    flex-shrink: 0;
    height: var(--time-series-height);

    .chart-container {
      width: 100%;
      height: 100%;
    }
  }

  .chart-state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;
    color: rgba(255, 255, 255, 0.45);
    padding: 20px;
  }

  .panel-details {
    min-height: var(--time-series-legend-height);
    overflow-wrap: anywhere;
  }

  .legend-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;

    .legend {
      flex: 1;
      min-width: 0;
    }
  }

  &.compact {
    --time-series-legend-height: 0px;
    --time-series-gap: 10px;
    --time-series-height: clamp(230px, 28vw, 320px);

    .panel-header {
      padding-bottom: 3px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 2px;

      :deep(.items) {
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 38px;
      }

      :deep(.right) {
        margin-left: auto;
      }
    }

    .panel-content {
      margin-top: 0;
    }

    .chart-state {
      gap: 16px;
      color: rgba(255, 255, 255, 0.55);
      padding: 0;
    }
  }

  :deep(.universal-chart-root) {
    @include time-series-chart;
    @include time-series-annotations;
  }

  &.with-annotations :deep(.grid) {
    opacity: 0.1;
  }
}
</style>
