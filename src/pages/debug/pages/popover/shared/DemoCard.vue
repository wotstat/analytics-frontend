<template>
  <div class="demo-card" :class="{ interactive, big }">
    <slot></slot>
  </div>
</template>


<script setup lang="ts">

defineProps<{
  interactive?: boolean
  big?: boolean
}>()

</script>


<style scoped lang="scss">
.demo-card {
  background-color: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
  color: #f6f6f6;
  font-size: 13px;
  line-height: 1.4;
  padding: 0.5em 0.7em;
  max-width: 260px;

  &.interactive {
    pointer-events: auto;
  }

  &.big {
    width: 260px;
    height: 160px;
  }

  :deep(.value) {
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: #ffffffb0;
  }

  :deep(.hint) {
    font-size: 11px;
    color: #ffffff80;
  }
}
</style>
