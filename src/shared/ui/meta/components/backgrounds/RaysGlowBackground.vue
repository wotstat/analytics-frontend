<template>
  <MetaCardBackground v-bind="props" palette="lavender" class="background-rays-glow" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-rays-glow {
  background: linear-gradient(125deg, #172231, #273345);

  &::before {
    background:
      linear-gradient(125deg, transparent 43%, #c0d0ed0d 44%, #c0d0ed0d 58%, transparent 59%),
      linear-gradient(125deg, transparent 66%, #c0d0ed14 67%, #c0d0ed14 77%, transparent 78%);
  }

  &::after {
    inset: -120px;
    background:
      radial-gradient(ellipse 90% 120% at 100% 5%, #356a7966 0%, #356a792e 40%, #356a7900 100%),
      radial-gradient(ellipse 90% 110% at 80% 115%, #6d598973 0%, #6d598933 40%, #6d598900 100%);
    filter: blur(76px);
  }
}
</style>
