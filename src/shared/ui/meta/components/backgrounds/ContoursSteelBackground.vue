<template>
  <MetaCardBackground v-bind="props" palette="teal" class="background-contours-steel" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-contours-steel {
  background:
    linear-gradient(140deg, #1a2630, #2b3c46);

  &::before {
    background: url('../assets/contours.svg') center / cover;
    transform: translate(90px, -20px) scale(1.3);
    mask-image: linear-gradient(90deg, transparent 25%, #000 90%);
    filter: grayscale(1);
    opacity: .65;
  }
}
</style>
