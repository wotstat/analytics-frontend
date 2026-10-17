<template>
  <MetaCardBackground v-bind="props" palette="lavender" class="background-aurora-mist">
    <img :src="texture" alt="" class="texture">
  </MetaCardBackground>
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'
import texture from '../assets/aurora-mist.png'

const props = withDefaults(defineProps<MetaCardPatternProps>(), { pattern: 'noise' })
</script>

<style scoped lang="scss">
.background-aurora-mist {
  --meta-card-noise-opacity: .18;

  background: #141b27;

  .texture {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
