<template>
  <MetaCardBackground v-bind="props" palette="neutral" class="background-grain" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = withDefaults(defineProps<MetaCardPatternProps>(), { pattern: 'noise' })
</script>

<style scoped lang="scss">
.background-grain {
  --meta-card-noise-opacity: .32;

  background:
    radial-gradient(ellipse at 80% 15%, #42484b40, transparent 70%),
    linear-gradient(120deg, #22272b, #2b3034);

  &::before {
    background: linear-gradient(140deg, #10151926, transparent 70%);
  }
}
</style>
