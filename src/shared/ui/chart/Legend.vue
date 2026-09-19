<template>
  <div class="legend" :class="`legend-${props.layout}`">
    <button v-for="item, i in items" :key="item.tag" class="item" :style="{ ['--item-color']: item.color }"
      @mouseenter="highlight(item)" @mouseleave="clearHighlight" @click="toggle(item, $event)"
      @auxclick="emit('remove', item)" :class="classForItem(item)" :aria-busy="item.loading || undefined">

      <div class="marker-slot">
        <Transition name="legend-marker">
          <div v-if="item.loading" key="loading" class="marker loading-marker">
            <Loader compact class="item-loader" />
          </div>
          <LegendColorPicker v-else-if="colorEditable" key="color" class="marker" :placement="'bottom-float'"
            :model-value="item.color" @update:model-value="color => emit('colorChange', item, `#${color}`)" />
          <div v-else key="static" class="marker"></div>
        </Transition>
      </div>

      <div class="name">{{ item.name }}</div>
      <button v-if="removable" class="remove" @click.stop="emit('remove', item)">
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
import Loader from '@/shared/ui/loaders/loader/Loader.vue'

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
    interactive: isInteractive(item),
    loading: !!item.loading
  }
}

function isEnabled(item: TItem) {
  return props.legend.isEnabled(item)
}

function isInteractive(item: TItem) {
  return props.toggleable || (props.highlightable && isEnabled(item))
}

function toggle(item: TItem, event: MouseEvent) {
  if (!props.toggleable) return
  props.legend.toggleFromClick(item, event.shiftKey)
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
  gap: 0.3em 1em;
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

    .loading-marker::before {
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
}
</style>
