<template>
  <MetaCardBackground v-bind="props" palette="lavender" class="background-aurora" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = withDefaults(defineProps<MetaCardPatternProps>(), { pattern: 'noise' })
</script>

<style scoped lang="scss">
.background-aurora {
  --meta-card-noise-opacity: .1;

  background:
    radial-gradient(ellipse 45% 90% at 100% 8%, #315b6073, transparent 80%),
    radial-gradient(ellipse 45% 80% at 68% 110%, #5b477d80, transparent 82%),
    radial-gradient(ellipse 55% 80% at 30% -15%, #273d6633, transparent 80%),
    #171d2b;

  &::before {
    background: linear-gradient(90deg, #11182433, transparent 65%);
  }
}
</style>
