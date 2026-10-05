<template>
  <DefineAggregationTile v-slot="{ item }">
    <SelectionTile class="aggregation-option" density="compact"
      :selected="selected.includes(item === 'mean' ? metric : `${metric}_${item}`)"
      :disabled="isDisabled(item === 'mean' ? metric : `${metric}_${item}`)"
      @select="selectAggregation(item === 'mean' ? metric : `${metric}_${item}`)">
      {{ item === 'mean' ? 'Среднее' : item.startsWith('q') ? `${Number(item.slice(1))}%` : aggregations[item].label }}
    </SelectionTile>
  </DefineAggregationTile>

  <PopoverAutoClose v-model="open" :target :arrow-size="0"
    :placement="['bottom-end', 'top-end', 'right-start-float', 'left-start-float']" :offset="4"
    :viewport-offset="popoverViewportOffset">
    <div class="aggregation-menu" @pointerdown.stop @pointerup.stop @click.stop>
      <div class="aggregation-heading">{{ metricLabel(metric) }}</div>
      <div class="aggregation-options nice-scrollbar">
        <section class="aggregation-group">
          <div class="aggregation-grid basic-aggregations">
            <AggregationTile item="mean" class="mean" />
            <AggregationTile item="min" />
            <AggregationTile item="max" />
          </div>
        </section>
        <section class="aggregation-group quantiles">
          <h3>
            Квантили
            <span class="quantile-help" v-quantile-tooltip="{ disabled: !open }">?</span>
          </h3>
          <div class="aggregation-grid">
            <AggregationTile v-for="item in ['01', '05', '10', '25', '50', '75', '90', '95', '99']"
              :key="item" :item="`q${item}`" />
          </div>
        </section>
        <AggregationTile item="zero" />
      </div>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { createReusableTemplate } from '@vueuse/core'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { aggregations, metricLabel, type AggregatableSlot, type Slot } from './vehicleMetrics'
import { useTooltip } from '@/shared/uiKit/tooltip/useTooltip'
import QuantileTooltip from './QuantileTooltip.vue'

const vQuantileTooltip = useTooltip<{ disabled: boolean }>(QuantileTooltip, {
  interactive: true,
  interactiveDelay: 450,
  interactiveHideDelay: 300,
  arrowSize: 6,
  offset: 8,
  placement: ['right-float', 'left-float', 'top-float', 'bottom-float'],
  viewportOffset: popoverViewportOffset,
  valueAdapter: value => ({ contentProps: {}, tooltipProps: { disabled: value.disabled } }),
})

type AggregationItem = 'mean' | keyof typeof aggregations

const [DefineAggregationTile, AggregationTile] = createReusableTemplate<{ item: AggregationItem }>({
  props: { item: String as PropType<AggregationItem> },
})

const props = defineProps<{
  metric: AggregatableSlot
  target: HTMLButtonElement | null
  selected: readonly Slot[]
  maxSlots?: number
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ select: [slot: Slot] }>()

function selectAggregation(slot: Slot) {
  emit('select', slot)
}

function isDisabled(slot: Slot) {
  if (props.maxSlots === undefined) return false
  if (props.selected.includes(slot)) return false
  return props.selected.length >= props.maxSlots
}
</script>

<style scoped lang="scss">
.aggregation-menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(250px, calc(100vw - 20px));
  max-height: min(450px, 60dvh);
  overflow: hidden;
  line-height: 1.3;

  .aggregation-heading {
    flex: none;
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 14px;
    font-weight: 600;
  }

  .aggregation-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px;
    min-height: 0;
    overflow-y: auto;
  }

  .aggregation-group {
    h3 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 6px;
      color: rgba(255, 255, 255, 0.55);
      font-size: 11px;
      font-weight: 500;
    }

    .aggregation-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px;
    }

    .basic-aggregations {
      --selection-tile-justify-content: center;

      grid-template-columns: repeat(2, minmax(0, 1fr));

      .mean {
        grid-column: 1 / -1;
      }
    }

    &.quantiles .aggregation-option {
      --selection-tile-main-padding: 5px 4px;
      --selection-tile-justify-content: center;

      font-variant-numeric: tabular-nums;
    }
  }

  .quantile-help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: bold;
    border-radius: 50%;
    font-size: 10px;
    cursor: help;

    &:hover {
      color: #f6f6f6;
    }
  }

  .aggregation-option {
    flex: none;
    width: 100%;
  }
}
</style>
