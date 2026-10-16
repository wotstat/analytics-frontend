<template>
  <MetaCardBackground v-bind="props" palette="slate" class="background-vehicles" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-vehicles {
  background:
    radial-gradient(ellipse 85% 125% at 110% 0%, #0e1319 8%, #13191f99 40%, transparent 88%),
    radial-gradient(ellipse 85% 60% at -10% 105%, #0f131880, transparent 85%),
    #1b1f23;

  &::before {
    background: linear-gradient(125deg, transparent 30%, #0b0f1440 51%, transparent 72%);
  }
}
</style>
