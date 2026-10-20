<template>
  <div class="legend" :class="`legend-${props.layout}`">
    <LegendEntry v-for="item in items"
      :key="item.tag"
      :item
      :legend
      :toggleable
      :highlightable
      :color-editable
      :removable
      :marker-style="resolvedMarkerStyle"
      @color-change="(item, color) => emit('colorChange', item, color)"
      @remove="item => emit('remove', item)" />
  </div>
</template>


<script setup lang="ts" generic="TItem extends LegendItem">
import { computed, onBeforeUnmount, watch } from 'vue'
import type { LegendItem, LegendModel } from './useLegend'
import { resolveMarkerStyle, type MarkerStyle } from '../utils/markerStyle'
import LegendEntry from './LegendEntry.vue'

type Props<TItem extends LegendItem> = {
  legend: LegendModel<TItem>
  layout?: 'horizontal' | 'vertical'
  toggleable?: boolean
  highlightable?: boolean
  colorEditable?: boolean
  removable?: boolean
  markerStyle?: MarkerStyle
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
const resolvedMarkerStyle = computed(() => resolveMarkerStyle(props.markerStyle, items.value.length))

watch(() => props.highlightable, highlightable => {
  if (!highlightable) props.legend.clearHighlight()
})

watch(() => props.legend, (_, previousLegend) => previousLegend.clearHighlight())

onBeforeUnmount(() => props.legend.clearHighlight())

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
}
</style>
