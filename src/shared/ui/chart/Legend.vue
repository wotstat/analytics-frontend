<template>
  <div class="legend" :class="`legend-${props.layout}`">
    <button v-for="item in props.series" :key="item.key ?? item.name" class="item" type="button" :class="{
      interactive: props.toggleable || props.highlightable,
      disabled: !isEnabled(item),
      highlighted: isHighlighted(item)
    }" :aria-disabled="!props.toggleable" :aria-pressed="props.toggleable ? isEnabled(item) : undefined"
      :tabindex="props.toggleable ? 0 : -1" @click="toggle(item)" @mouseenter="highlight(item)"
      @mouseleave="clearHighlight(item)">
      <span class="marker" :style="{ backgroundColor: item.color }"></span>
      <span>{{ item.name }}</span>
    </button>
  </div>
</template>


<script setup lang="ts">
import { watch } from 'vue'

type Series = {
  color: string
  name: string
  key?: string
}

type Props = {
  series: Series[]
  layout?: 'horizontal' | 'vertical'
  toggleable?: boolean
  highlightable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'horizontal',
  toggleable: false,
  highlightable: false,
})

const enabled = defineModel<Series[]>('enabled')
const highlighted = defineModel<Series | null>('highlighted', { default: null })

watch([() => props.series, () => props.toggleable], ([series, toggleable]) => {
  if (!toggleable || enabled.value === undefined) enabled.value = [...series]
}, { immediate: true })

function isEnabled(item: Series) {
  return enabled.value?.includes(item) ?? true
}

function isHighlighted(item: Series) {
  return highlighted.value === item
}

function toggle(item: Series) {
  if (!props.toggleable) return

  const current = enabled.value ?? props.series
  enabled.value = current.includes(item)
    ? current.filter(series => series !== item)
    : [...current, item]
}

function highlight(item: Series) {
  if (props.highlightable) highlighted.value = item
}

function clearHighlight(item: Series) {
  if (props.highlightable && highlighted.value === item) highlighted.value = null
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
