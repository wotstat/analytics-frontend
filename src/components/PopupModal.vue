<template>
  <div class="popup-target" ref="target">
    <slot></slot>
  </div>

  <Teleport to="body">
    <div class="popup" :style="{
      '--left': targetBounding.left.value + 'px',
      '--top': targetBounding.top.value + targetBounding.height.value + 'px',
    }">
      <slot name="popup"></slot>
    </div>
  </Teleport>

</template>

<script setup lang="ts">
import { useElementBounding } from '@vueuse/core';
import { ref } from 'vue';

const target = ref<HTMLElement | null>(null)

const targetBounding = useElementBounding(target)
</script>

<style scoped lang="scss">
.popup {
  position: fixed;
  left: var(--left);
  top: var(--top);
  z-index: 1000;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 8px;
}
</style>