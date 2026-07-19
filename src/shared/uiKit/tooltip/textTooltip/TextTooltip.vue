<template>
  <div class="text-tooltip">{{ text }}</div>
</template>

<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<style scoped>
.text-tooltip {
  max-width: 320px;
  padding: 6px 8px;
  line-height: 1.2;
  white-space: pre-wrap;
  font-size: 14px;
}
</style>
