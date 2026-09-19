<template>
  <div class="legend" :class="`legend-${props.layout}`">
    <button v-for="item, i in items" :key="item.tag" class="item" :style="{ ['--item-color']: item.color }"
      @mouseenter="highlight(item)" @mouseleave="clearHighlight" @click="toggle(item)" @auxclick="emit('remove', item)"
      :class="classForItem(item)">

      <LegendColorPicker v-if="colorEditable" class="marker" :placement="'bottom-float'" :model-value="item.color"
        @update:model-value="color => emit('colorChange', item, `#${color}`)" />
      <div v-else class="marker"></div>

      <div class="name">{{ item.name }}</div>
      <button v-if="removable" class="remove" @click="emit('remove', item)">
        <XIcon class="icon" />
      </button>
    </button>
  </div>


</template>


<script setup lang="ts" generic="TItem extends LegendItem">
import { computed, onBeforeUnmount, watch } from 'vue'
import type { LegendItem, LegendModel } from './useLegend'
import LegendColorPicker from './LegendColorPicker.vue'
import XIcon from '@/assets/icons/x.svg'

type Props<TItem extends LegendItem> = {
  legend: LegendModel<TItem>
  layout?: 'horizontal' | 'vertical'
  toggleable?: boolean
  highlightable?: boolean
  colorEditable?: boolean
  removable?: boolean
}

const props = withDefaults(defineProps<Props<TItem>>(), {
  layout: 'horizontal',
  toggleable: false,
  highlightable: false,
})

const emit = defineEmits<{
  colorChange: [item: TItem, color: string]
  remove: [item: TItem]
}>()

const items = computed(() => props.legend.items.value)

watch(() => props.highlightable, highlightable => {
  if (!highlightable) props.legend.clearHighlight()
})

watch(() => props.legend, (_, previousLegend) => previousLegend.clearHighlight())

onBeforeUnmount(() => props.legend.clearHighlight())

function classForItem(item: TItem) {
  return {
    disabled: !props.legend.isEnabled(item),
    highlighted: props.highlightable && props.legend.isHighlighted(item),
    interactive: isInteractive(item)
  }
}

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
  flex-wrap: wrap;
  gap: 1em;
  font-size: 14px;

  &-horizontal {
    flex-direction: row;
  }

  &-vertical {
    flex-direction: column;
  }

  .item {
    font-size: 1em;
    display: flex;
    flex-direction: row;
    align-items: center;

    &.disabled {

      .marker,
      .name,
      .remove {
        opacity: 0.5;
      }
    }

    &.highlighted {
      .marker {
        &::before {
          transform: scale(1.3);
        }
      }
    }

    .marker {
      width: 1.5em;
      height: 1.5em;
      display: flex;
      align-items: center;
      justify-content: center;

      &::before {
        content: '';
        display: inline-block;
        width: 0.6em;
        height: 0.6em;
        border-radius: 50%;
        background-color: var(--item-color);
        transition: transform 0.15s ease;
      }
    }

    .remove {
      width: 1.5em;
      height: 1.5em;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        opacity: 1;

        .icon {
          opacity: 1;
        }
      }

      .icon {
        width: 0.9em;
        height: 0.9em;
        fill: currentColor;
        display: block;
        opacity: 0.8;
      }
    }
  }
}
</style>
