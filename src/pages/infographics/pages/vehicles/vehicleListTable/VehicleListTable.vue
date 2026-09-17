<template>

  <div class="table">
    <div class="head">
      <div class="line">
        <div class="name" :style="{ width: `${nameColumnWidth}%` }">
          <Icon :icon="'tank'" class="icon" />
        </div>
        <div class="values" :style="{ width: `${valuesColumnWidth}%` }">
          <div class="value" v-for="slot, index in slots" :key="slot.icon"
            :style="{ width: `${valueColumnWidths[index]}%` }">
            <Icon :icon="slot.icon" class="icon" />
          </div>
        </div>
      </div>
    </div>

    <div class="body">
      <div class="line">
        <div class="name" :style="{ width: `${nameColumnWidth}%` }"></div>
        <div class="values" :style="{ width: `${valuesColumnWidth}%` }"></div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { Slot } from './helpers'
import { computed } from 'vue'

const props = defineProps<{
  slots: Slot[]
}>()

const nameColumnWidth = computed(() => 30)
const valuesColumnWidth = computed(() => 100 - nameColumnWidth.value)

const valueColumnWidths = computed(() => {
  return props.slots.map(() => 100 / props.slots.length)
})
</script>


<style lang="scss" scoped>
.table {
  .head {

    .value,
    .name {
      text-align: center;

      .icon {
        width: 40px;
        color: white;
      }
    }

  }

  .body {}

  .line {
    .name {
      display: inline-block;
    }

    .values {
      display: inline-block;

      .value {
        display: inline-block;
      }
    }
  }
}
</style>