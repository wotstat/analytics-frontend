<template>
  <MetaCardBackground v-bind="props" palette="olive" class="background-contours" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-contours {
  background:
    radial-gradient(ellipse 70% 120% at 100% 60%, #3e4c3899, transparent 85%),
    linear-gradient(120deg, #202724, #2a312a);

  &::before {
    background: url('../assets/contours.svg') center / cover;
    mask-image: linear-gradient(90deg, transparent 15%, #000 70%);
  }
}
</style>
