<template>
  <button @click="value = !value" :class="{ checked: value }">
    <CheckmarkIcon v-if="value" />
  </button>
</template>


<script setup lang="ts">

import CheckmarkIcon from './assets/checkmark-bold.svg'
const props = defineProps<{}>()

const value = defineModel<boolean>({
  default: false,
})
</script>


<style lang="scss" scoped>
button {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background-color: #ffffff11;
  border: 1px solid #7c7c7c;
  cursor: pointer;
  padding: 0;
  transition: none;


  &:hover {
    border: 1px solid #a7a7a7;
  }

  svg {
    width: 11px;
    height: 11px;
    fill: #ffffff;
    display: block;
  }

  &.checked {
    background-color: var(--accent-color, #12a2e4);
    border-color: var(--accent-color, #12a2e4);

    svg {
      fill: #2f2f2f;
    }
  }
}
</style>