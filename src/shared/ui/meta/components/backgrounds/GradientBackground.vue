<template>
  <MetaCardBackground v-bind="props" palette="blue" class="background-gradient" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-gradient {
  background:
    radial-gradient(ellipse 85% 125% at 110% 0%, #10171e73 8%, #161e2640 40%, transparent 88%),
    radial-gradient(ellipse 85% 60% at -10% 105%, #11182040, transparent 85%),
    linear-gradient(135deg, #1c2229, #29333e);

  &::before {
    background: linear-gradient(125deg, transparent 30%, #0b0f1426 51%, transparent 72%);
  }
}
</style>
