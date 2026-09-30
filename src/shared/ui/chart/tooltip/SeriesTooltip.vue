<template>
  <div class="series-tooltip" :class="[`columns-${columns.length}`, { horizontal }]">
    <div v-if="$slots.header" class="header">
      <slot name="header" v-bind="{ columnCount: columns.length, horizontal }"></slot>
    </div>
    <div class="value-columns">
      <div v-for="column, index in columns" :key="index" class="value-column">
        <div v-for="item in column" :key="item.tag" class="value-row" :class="{ missing: item.value == null }">
          <span class="source">
            <span class="dot" :class="{ highlighted: item.highlighted }" :style="{ backgroundColor: item.color }"></span>
            <span>{{ item.name }}</span>
          </span>
          <b v-if="item.value != null">{{ formatValue(item.value, item) }}</b>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TItem extends SeriesTooltipItem">
import { computed } from 'vue'
import type { SeriesTooltipItem } from './seriesTooltip'

const props = defineProps<{
  items: readonly TItem[]
  formatValue: (value: number, item: TItem) => string
}>()

const MAX_ROWS_PER_COLUMN = 10
const MAX_COLUMNS = 3

const columns = computed(() => {
  const count = Math.max(1, Math.min(MAX_COLUMNS, Math.ceil(props.items.length / MAX_ROWS_PER_COLUMN)))
  const baseSize = Math.floor(props.items.length / count)
  const remainder = props.items.length % count
  let offset = 0

  return Array.from({ length: count }, (_, index) => {
    const size = baseSize + Number(index < remainder)
    const column = props.items.slice(offset, offset + size)
    offset += size
    return column
  })
})

const horizontal = computed(() => columns.value.length >= 2)
</script>

<style scoped lang="scss">
.series-tooltip {
  box-sizing: border-box;
  max-height: 50vh;
  overflow-y: auto;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;

  &.columns-1 {
    width: max-content;
    max-width: calc(100vw - 40px);
  }

  &.columns-2 {
    width: min(420px, calc(100vw - 40px));
  }

  &.columns-3 {
    width: min(620px, calc(100vw - 40px));
  }

  &.horizontal .header {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  &.columns-2 .value-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &.columns-3 .value-columns {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .value-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    column-gap: 20px;

    .value-column {
      min-width: 0;

      .value-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;

        b {
          color: white;
          white-space: nowrap;
        }

        &.missing {
          color: rgba(255, 255, 255, 0.5);
        }

        .source {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          overflow-wrap: anywhere;

          .dot {
            width: 6px;
            height: 6px;
            flex-shrink: 0;
            border-radius: 50%;
            transition: transform 0.15s;

            &.highlighted {
              transform: scale(1.4);
            }
          }
        }
      }
    }
  }

  .header + .value-columns {
    margin-top: 6px;
  }
}
</style>
