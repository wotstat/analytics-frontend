<template>
  <div class="levels">
    <button class="level mt-font" :class="{
      'active': levels.has(level)
    }" v-for="level in new Array(11).fill(0).map((_, i) => i + 1)" :key="level" @click="e => onClickLevel(e, level)">
      {{ numberToRoman(level) }}
    </button>
  </div>
</template>


<script setup lang="ts">
import { numberToRoman } from '@/utils'

const levels = defineModel<Set<number>>({ required: true })


function onClickLevel(event: MouseEvent, level: number) {
  event.preventDefault()
  event.stopPropagation()
  if (levels.value.has(level)) {
    levels.value.delete(level)
  } else {

    if (!event.shiftKey) levels.value.clear()
    levels.value.add(level)
  }
}


</script>


<style lang="scss" scoped>
.levels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .level {
    background: rgba(102, 102, 102, 0.15);
    box-shadow: none;
    cursor: pointer;
    transition: background-color 0.2s;
    border: none;
    flex: 1;
    border-radius: 15px;

    &:hover {
      background-color: rgba(102, 102, 102, 0.3);
    }

    &.active {
      background-color: #4a90e2;
    }
  }
}
</style>