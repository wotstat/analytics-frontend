<template>
  <button class="item"
    :style="{ ['--item-color']: item.color }"
    @mouseenter="highlight"
    @mouseleave="clearHighlight"
    @click="toggle"
    @auxclick="emit('remove', item)"
    :class="classes"
    :aria-busy="item.loading || undefined">

    <div class="marker-slot">
      <Transition name="legend-marker">
        <div v-if="item.loading" key="loading" class="marker loading-marker">
          <Loader compact class="item-loader" />
        </div>
        <LegendColorPicker v-else-if="colorEditable" key="color" class="marker editable-marker"
          :placement="['bottom-float', 'left-float', 'top-float']"
          :model-value="item.color" @update:model-value="color => emit('colorChange', item, `#${color}`)" />
        <div v-else key="static" class="marker"></div>
      </Transition>
    </div>

    <div class="name">{{ item.name }}</div>
    <button v-if="removable" class="remove" @click.stop="emit('remove', item)">
      <XIcon class="icon" />
    </button>
  </button>
</template>


<script setup lang="ts" generic="TItem extends LegendItem">
import { computed } from 'vue'
import type { LegendItem, LegendModel } from './useLegend'
import type { MarkerStyle } from '../utils/markerStyle'
import LegendColorPicker from './LegendColorPicker.vue'
import XIcon from '@/assets/icons/x.svg'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'

const props = defineProps<{
  item: TItem
  legend: LegendModel<TItem>
  toggleable: boolean
  highlightable: boolean
  colorEditable?: boolean
  removable?: boolean
  markerStyle: MarkerStyle
}>()

const emit = defineEmits<{
  colorChange: [item: TItem, color: string]
  remove: [item: TItem]
}>()

const enabled = computed(() => props.legend.isEnabled(props.item))
const classes = computed(() => ({
  disabled: !enabled.value,
  highlightable: props.highlightable,
  highlighted: props.highlightable && props.legend.isHighlighted(props.item),
  outlined: props.markerStyle === 'outlined',
  glow: props.markerStyle === 'glow',
  interactive: props.toggleable || (props.highlightable && enabled.value),
  loading: !!props.item.loading,
}))

function toggle(event: MouseEvent) {
  if (!props.toggleable) return
  props.legend.toggleFromClick(props.item, event.shiftKey, event.altKey)
}

function highlight() {
  if (props.highlightable && enabled.value) props.legend.highlight(props.item)
}

function clearHighlight() {
  if (props.highlightable) props.legend.clearHighlight()
}
</script>


<style lang="scss" scoped>
.item {
  font-size: 1em;
  display: flex;
  flex-direction: row;
  align-items: center;
  transition: color 0.15s ease;

  &.disabled {

    .marker-slot,
    .name,
    .remove {
      opacity: 0.5;
    }
  }

  &.highlighted {
    color: white;

    .marker {
      &::before {
        transform: scale(1.3);
      }
    }
  }

  &.outlined {
    &.highlighted .marker {
      &::before {
        transform: scale(0.9);
      }

      &::after {
        opacity: 1;
        transform: scale(2);
        filter: blur(0px);
      }
    }

    &.highlightable .marker.editable-marker:hover {
      &::before {
        transform: scale(1.3);
      }

      &::after {
        opacity: 0;
        transform: scale(1.3);
      }
    }
  }

  &.glow {

    .marker {
      &::after {
        border: 0;
        border: 2px solid var(--item-color);
        transform: scale(2);
        filter: blur(4px);
      }
    }

    &.highlightable .marker.editable-marker:hover::before {
      transform: scale(1.2);
    }

    &.highlighted .marker {
      &::before {
        transform: scale(1.1);
      }

      &::after {
        opacity: 0.6;
      }
    }
  }

  .marker-slot {
    position: relative;
    width: 1.5em;
    height: 1.5em;
    flex-shrink: 0;
  }

  .marker {
    position: absolute;
    inset: 0;
    font-size: inherit;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    &.legend-marker-enter-active,
    &.legend-marker-leave-active {
      transition: opacity 0.18s ease, filter 0.18s ease, transform 0.18s ease;
    }

    &.legend-marker-enter-from,
    &.legend-marker-leave-to {
      opacity: 0;
      filter: blur(3px);
      transform: scale(0.65);
    }

    &.legend-marker-leave-active {
      pointer-events: none;
    }

    &::before,
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      margin: auto;
      width: 0.6em;
      height: 0.6em;
      box-sizing: border-box;
      border-radius: 50%;
      transition: transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
    }

    &::before {
      z-index: 1;
      background-color: var(--item-color);
    }

    &::after {
      z-index: 0;
      border: 1px solid var(--item-color);
      opacity: 0;
      transform: scale(0.65);
      filter: blur(3px);
    }
  }

  .loading-marker::before,
  .loading-marker::after {
    content: none;
  }

  .item-loader {
    color: var(--item-color);
    font-size: 16px;
  }

  .remove {
    width: 1.5em;
    height: 1.5em;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset: 1.5px;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.08);
      opacity: 0;
      transition: opacity 0.15s;
    }

    &:hover {
      opacity: 1;

      &::before {
        opacity: 1;
      }

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
</style>
