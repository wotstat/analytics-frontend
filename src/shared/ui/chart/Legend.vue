<template>
  <div class="legend" :class="`legend-${props.layout}`">
    <button v-for="item in items" :key="item.tag" class="item" type="button" :class="{
      interactive: isInteractive(item),
      disabled: !props.legend.isEnabled(item),
      highlighted: props.highlightable && props.legend.isHighlighted(item)
    }" :aria-disabled="!props.toggleable" :aria-pressed="props.toggleable ? isEnabled(item) : undefined"
      :tabindex="props.toggleable ? 0 : -1" @click="toggle(item)" @mouseenter="highlight(item)"
      @mouseleave="clearHighlight">
      <span class="marker" :style="{ backgroundColor: item.color }"></span>
      <span>{{ item.name }}</span>
    </button>
  </div>
</template>


<script setup lang="ts" generic="TItem extends LegendItem">
import { computed, onBeforeUnmount, watch } from 'vue'
import type { LegendItem, LegendModel } from './useLegend'

type Props<TItem extends LegendItem> = {
  legend: LegendModel<TItem>
  layout?: 'horizontal' | 'vertical'
  toggleable?: boolean
  highlightable?: boolean
}

const props = withDefaults(defineProps<Props<TItem>>(), {
  layout: 'horizontal',
  toggleable: false,
  highlightable: false,
})

const items = computed(() => props.legend.items.value)

watch(() => props.highlightable, highlightable => {
  if (!highlightable) props.legend.clearHighlight()
})

watch(() => props.legend, (_, previousLegend) => previousLegend.clearHighlight())

onBeforeUnmount(() => props.legend.clearHighlight())

function isEnabled(item: TItem) {
  return props.legend.isEnabled(item)
}

function isInteractive(item: TItem) {
  return props.toggleable || (props.highlightable && isEnabled(item))
}

function toggle(item: TItem) {
  if (!props.toggleable) return
  props.legend.toggle(item)
}

function highlight(item: TItem) {
  if (props.highlightable && isEnabled(item)) props.legend.highlight(item)
}

function clearHighlight() {
  if (props.highlightable) props.legend.clearHighlight()
}
</script>


<style lang="scss" scoped>
.legend {
  display: flex;
  gap: 8px 16px;

  &-horizontal {
    flex-flow: row wrap;
  }

  &-vertical {
    flex-direction: column;
    align-items: flex-start;
  }
}

.item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  color: inherit;
  font: inherit;
  background: none;
  cursor: default;

  &.interactive {
    cursor: pointer;
    user-select: none;
  }

  &.disabled {
    opacity: 0.35;

    .marker {
      transform: none;
      transition: none;
    }
  }

  &.highlighted .marker {
    transform: scale(1.25);
  }
}

.marker {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  transition: transform 0.15s;
}
</style>
