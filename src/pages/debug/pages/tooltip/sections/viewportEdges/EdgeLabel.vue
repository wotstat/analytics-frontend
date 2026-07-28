<template>
  <div class="edge-label">
    <div class="title">{{ label }}</div>
    <div class="hint">куда встал — видно по стрелке</div>
  </div>
</template>


<script setup lang="ts">
defineProps<{
  label: string
}>()

</script>


<style scoped lang="scss">
.edge-label {
  padding: 5px 8px;
  font-size: 13px;

  .title {
    font-weight: var(--bold-weight);
  }

  .hint {
    font-size: 11px;
    color: #ffffff80;
  }
}
</style>
