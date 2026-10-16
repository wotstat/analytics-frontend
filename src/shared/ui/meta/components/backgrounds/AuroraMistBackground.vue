<template>
  <MetaCardBackground v-bind="props" palette="lavender" class="background-aurora-mist" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = withDefaults(defineProps<MetaCardPatternProps>(), { pattern: 'noise' })
</script>

<style scoped lang="scss">
.background-aurora-mist {
  background: linear-gradient(125deg, #141b27, #182132);

  &::before {
    inset: -140px;
    background:
      radial-gradient(ellipse 85% 120% at 100% 0%, #3b707ca6 0%, #3b707c66 25%, #3b707c2e 50%, #3b707c0d 75%, #3b707c00 100%),
      radial-gradient(ellipse 80% 100% at 65% 110%, #735a958c 0%, #735a9559 25%, #735a9526 55%, #735a950a 80%, #735a9500 100%);
    filter: blur(76px);
    opacity: .62;
  }
}
</style>
