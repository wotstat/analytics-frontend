<template>
  <button :class="{ bold: bold }" @click="emits('click')">{{ text }}</button>
</template>


<script setup lang="ts">
defineProps<{
  text: string
  bold?: boolean
}>()

const emits = defineEmits<{
  (e: 'click'): void
}>()

</script>


<style lang="scss" scoped>
button {
  box-sizing: border-box;
  background: none;
  border: none;
  padding: 10px;
  color: var(--accent-color, #0099ff);
  transition: color 0.15s;
  cursor: pointer;

  &.bold {
    font-weight: bold;
  }

  &:hover {
    color: var(--accent-color-hover, #0084ff);
  }
}
</style>