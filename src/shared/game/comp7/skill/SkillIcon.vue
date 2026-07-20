<template>
  <span class="skill-icon"></span>
</template>

<script setup lang="ts">
defineProps<{
  skill: string
}>()
</script>

<style scoped lang="scss">
.skill-icon {
  display: block;
  width: 27px;
  height: 27px;
  flex: 0 0 27px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.035));
}
</style>
