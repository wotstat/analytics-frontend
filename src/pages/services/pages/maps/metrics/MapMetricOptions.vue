<template>
  <ColumnSelector
    ref="selector"
    v-model:open="open"
    :selected-count="selected.length"
    :max-slots
    :target
    :title
    :placement
    @clear="emit('clear')"
    @reset="emit('reset')"
    @dismiss-options="optionsOpen = false">
    <template #default="{ isModal }">
      <div class="map-columns" :class="{ 'modal-mode': isModal }">
        <section v-for="category in mapMetricCategories"
          :key="category.title"
          class="panel-section"
          :style="{ '--panel-heading-color': category.color }">
          <h3>{{ category.title }}</h3>
          <div class="tiles">
            <SelectionTile v-for="metric in category.metrics"
              :key="metric.id"
              class="tile"
              :class="{ 'with-subtitle': metric.subtitle }"
              :accent-color="metric.color"
              v-tooltip="{ text: metric.label, disabled: !open || !overflowingTiles[metric.id], placement: ['top-float', 'bottom-float'] }"
              :selected="selectedAggregations(metric.id).length > 0"
              :disabled="isTileDisabled(metric.id)"
              report-disabled-click
              :action="!!(metric.aggregations || metric.delta)"
              :action-open="optionsOpen && optionsMetric === metric.id"
              :action-active="deltaMetrics.includes(metric.id) || selectedAggregations(metric.id).some(value => value !== 'value')"
              @pointerenter="hoverTile(metric.id, $event)"
              @pointerleave="selector?.setLimitHovered(false)"
              @disabled-click="selector?.showLimitFeedback()"
              @select="selectMetric(metric.id)"
              @action="openOptions(metric.id, $event)">
              <Icon :icon="metric.icon" class="icon" :style="{ color: metric.color }" />
              <span class="text">
                <MetricLabel :text="metric.label" @overflow="overflowingTiles[metric.id] = $event" />
                <span v-if="metric.subtitle" class="subtitle">{{ metric.subtitle }}</span>
              </span>
              <span v-if="deltaMetrics.includes(metric.id) || tileLabel(metric.id)"
                class="variant"
                v-tooltip="{ text: mapDeltaLabel, disabled: !open || !deltaMetrics.includes(metric.id) }">
                <DeltaIcon v-if="deltaMetrics.includes(metric.id)" width="12" height="12" />
                {{ tileLabel(metric.id) }}
              </span>
              <template #action>
                <EllipsisIcon width="18" height="18" />
                <span v-if="selectedAggregations(metric.id).length > 1"
                  class="selection-count"
                  :style="{ color: metric.badgeTextColor }">
                  {{ selectedAggregations(metric.id).length }}
                </span>
              </template>
            </SelectionTile>
          </div>
        </section>
      </div>

      <MetricOptionsPopover v-if="optionsMetric"
        v-model="optionsOpen"
        :target="optionsTrigger"
        :label="mapMetrics[optionsMetric].label"
        :width="300"
        :color="mapMetrics[optionsMetric].color"
        :sections="sections"
        :selected="selectedAggregations(optionsMetric)"
        :can-select="canSelectAggregation"
        @select="selectAggregation"
        @limit-hover="selector?.setLimitHovered($event)"
        @disabled-click="selector?.showLimitFeedback()">
        <template v-if="mapMetrics[optionsMetric].delta" #toolbar="{ isModal }">
          <SelectionTile
            :class="isModal ? 'delta-row' : 'delta-toggle'"
            v-tooltip="{ text: mapDeltaLabel, disabled: isModal || !optionsOpen }"
            :selected="deltaMetrics.includes(optionsMetric)"
            @select="toggleDelta">
            <DeltaIcon :width="isModal ? 16 : 12" :height="isModal ? 16 : 12" />
            <span v-if="isModal">{{ mapDeltaLabel }}</span>
          </SelectionTile>
        </template>
      </MetricOptionsPopover>
    </template>
  </ColumnSelector>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef } from 'vue'
import EllipsisIcon from '@/assets/icons/ellipsis.svg'
import Icon from '@/shared/game/components/efficiencyIcon/Icon.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import type { PlacementParam, PopoverTarget } from '@/shared/uiKit/popover/utils'
import { aggregationSections, type MetricOptionSection } from '../../shared/columnSelector/utils/aggregations'
import ColumnSelector from '../../shared/columnSelector/ColumnSelector.vue'
import MetricLabel from '../../shared/columnSelector/MetricLabel.vue'
import MetricOptionsPopover from '../../shared/columnSelector/MetricOptionsPopover.vue'
import DeltaIcon from './delta.svg'
import { mapDeltaLabel, mapMetricCategories, mapMetrics, mapMetricShortLabel, type MapAggregation, type MapMetric, type MapMetricSlot } from './catalog/mapMetrics'

const props = defineProps<{
  selected: readonly MapMetricSlot[]
  maxSlots?: number
  target?: PopoverTarget | null
  title?: string
  placement?: PlacementParam
}>()
const open = defineModel<boolean>('open', { default: false })
const deltaMetrics = defineModel<MapMetric[]>('deltaMetrics', { required: true })
const emit = defineEmits<{
  select: [slot: MapMetricSlot]
  removeMetric: [metric: MapMetric]
  clear: []
  reset: []
}>()
const selector = useTemplateRef('selector')
const optionsOpen = ref(false)
const optionsTrigger = shallowRef<HTMLButtonElement | null>(null)
const optionsMetric = ref<MapMetric | null>(null)
const overflowingTiles = ref<Partial<Record<MapMetric, boolean>>>({})

const sections = computed<MetricOptionSection<MapAggregation>[]>(() => {
  if (optionsMetric.value === null) return []
  const metric = mapMetrics[optionsMetric.value]
  if (metric.aggregations) return aggregationSections<MapAggregation>('value', metric.aggregations, key => key)
  return [{ options: [{ value: 'value', label: metric.label }] }]
})

function selectedAggregations(metric: MapMetric) {
  return props.selected.filter(slot => slot.metric === metric).map(slot => slot.aggregation)
}

function isTileDisabled(metric: MapMetric) {
  return props.maxSlots !== undefined && props.selected.length >= props.maxSlots && !selectedAggregations(metric).length
}

function canSelectAggregation(aggregation: MapAggregation) {
  if (props.maxSlots === undefined || props.selected.length < props.maxSlots) return true
  return props.selected.some(slot => slot.metric === optionsMetric.value && slot.aggregation === aggregation)
}

function hoverTile(metric: MapMetric, event: PointerEvent) {
  selector.value?.setLimitHovered(event.pointerType === 'mouse' && isTileDisabled(metric))
}

function tileLabel(metric: MapMetric) {
  const selected = selectedAggregations(metric)
  if (selected.length !== 1) return ''
  return mapMetricShortLabel({ metric, aggregation: selected[0] })
}

function openOptions(metric: MapMetric, event: MouseEvent) {
  if (optionsOpen.value && optionsMetric.value === metric) {
    optionsOpen.value = false
    return
  }

  optionsMetric.value = metric
  optionsTrigger.value = event.currentTarget as HTMLButtonElement
  optionsOpen.value = true
}

function selectMetric(metric: MapMetric) {
  optionsOpen.value = false
  if (props.maxSlots !== undefined && selectedAggregations(metric).length) {
    selector.value?.acceptLimitTip()
    emit('removeMetric', metric)
    return
  }

  emit('select', { metric, aggregation: 'value' })
}

function selectAggregation(aggregation: MapAggregation) {
  const metric = optionsMetric.value
  if (metric === null) return
  if (props.maxSlots !== undefined && selectedAggregations(metric).includes(aggregation)) selector.value?.acceptLimitTip()
  emit('select', { metric, aggregation })
}

function toggleDelta() {
  const metric = optionsMetric.value
  if (metric === null) return
  deltaMetrics.value = deltaMetrics.value.includes(metric)
    ? deltaMetrics.value.filter(value => value !== metric)
    : [...deltaMetrics.value, metric]
}
</script>

<style scoped lang="scss">
.map-columns {
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
    gap: 6px;
  }

  .tile {
    --selection-tile-main-padding: 2px 6px;
    --selection-tile-gap: 8px;

    &.with-subtitle {
      --selection-tile-main-padding: 7px 6px;
    }

    .icon {
      flex: none;
      width: 34px;
      height: 34px;
      margin: -2px;
    }

    .text {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.45);
      font-size: 11px;
      line-height: 1.3;
    }

    .variant {
      display: flex;
      flex: none;
      align-items: center;
      gap: 3px;
      margin-left: auto;
      color: rgba(255, 255, 255, 0.55);
      font-size: 11px;
      white-space: nowrap;
    }

    .selection-count {
      position: absolute;
      top: calc(50% - 14px);
      right: 1px;
      display: grid;
      place-items: center;
      min-width: 12px;
      height: 12px;
      border-radius: 6px;
      background: var(--selection-tile-accent, var(--blue-thin-color));
      color: white;
      font-size: 9px;
    }
  }

  &.modal-mode {
    h3 {
      font-size: 16px;
    }

    .tile {
      --selection-tile-main-padding: 4px 10px;
      --selection-tile-font-size: 16px;
      --selection-tile-action-width: 35px;

      &.with-subtitle {
        --selection-tile-main-padding: 4px 10px;
      }

      .icon {
        width: 40px;
        height: 40px;
        margin: -3px;
      }

      .subtitle,
      .variant {
        font-size: 13px;
      }
    }
  }
}

.delta-toggle.selection-tile {
  --selection-tile-min-height: 26px;
  --selection-tile-main-padding: 3px 7px;
  --selection-tile-accent-inset: 5px;

  margin-block: min(0px, calc((var(--panel-header-title-line-height, 26px) - 26px) / 2));
}

.delta-row {
  --selection-tile-gap: 8px;
}
</style>
