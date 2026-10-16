<template>
  <MetaCardBackground v-bind="props" palette="blue" class="background-grid" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-grid {
  background:
    radial-gradient(ellipse 65% 100% at 95% 10%, #24435b99, transparent 80%),
    #17232e;

  &::before {
    background:
      linear-gradient(#a3c7dd0d 1px, transparent 1px),
      linear-gradient(90deg, #a3c7dd0d 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: linear-gradient(90deg, #0002, #000);
  }
}
</style>
