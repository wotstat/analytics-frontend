<template>
  <MetaCardBackground v-bind="props" palette="teal" class="background-contours-glow" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-contours-glow {
  background: linear-gradient(125deg, #18232d, #24313c);

  &::before {
    background: url('../assets/contours.svg') center / cover;
    mask-image: linear-gradient(90deg, transparent 22%, #000 90%);
    opacity: .6;
  }

  &::after {
    inset: -120px;
    background:
      radial-gradient(ellipse 90% 120% at 100% 0%, #376c7866 0%, #376c7833 40%, #376c7800 100%),
      radial-gradient(ellipse 85% 105% at 85% 120%, #6d598966 0%, #6d59892e 40%, #6d598900 100%);
    filter: blur(72px);
  }
}
</style>
