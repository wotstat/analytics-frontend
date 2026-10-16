<template>
  <MetaCardBackground v-bind="props" palette="copper" class="background-ember" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = withDefaults(defineProps<MetaCardPatternProps>(), { pattern: 'noise' })
</script>

<style scoped lang="scss">
.background-ember {
  --meta-card-noise-opacity: .18;

  background:
    radial-gradient(ellipse 70% 120% at 95% 45%, #78503866, transparent 78%),
    linear-gradient(120deg, #252524, #332c28);

  &::before {
    background:
      radial-gradient(circle at 85% 53%, transparent 0 185px, #deb88b26 186px 187px, transparent 188px),
      radial-gradient(circle at 85% 53%, transparent 0 260px, #deb88b1a 261px 262px, transparent 263px),
      radial-gradient(circle at 85% 53%, transparent 0 335px, #deb88b0d 336px 337px, transparent 338px);
  }
}
</style>
