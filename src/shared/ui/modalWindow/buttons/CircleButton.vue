<template>
  <button @click="emits('click')">
    <slot></slot>
  </button>
</template>


<script setup lang="ts">
const props = defineProps<{}>()
const emits = defineEmits<{
  (e: 'click'): void
}>()

</script>


<style lang="scss" scoped>
button {
  border: none;
  border-radius: 50px;
  background-color: #7474742a;
  height: 30px;
  width: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s;

  &:hover {
    background-color: #9a9a9a2a;
  }

  :deep(.icon) {
    width: 16px;
    height: 16px;
    display: block;
  }
}
</style>