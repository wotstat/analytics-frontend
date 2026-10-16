<template>
  <div class="meta-card-background">
    <slot />
    <MetaCardPattern v-if="pattern && pattern !== 'none'" :pattern :pattern-size />
  </div>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, watchEffect } from 'vue'
import MetaCardPattern from './MetaCardPattern.vue'
import { metaCardPaletteKey, type MetaCardPalette } from './utils/palette'
import type { MetaCardPatternProps } from './utils/pattern'

const props = withDefaults(defineProps<MetaCardPatternProps & { palette?: MetaCardPalette }>(), { palette: 'lavender' })
const cardPalette = inject(metaCardPaletteKey, undefined)

watchEffect(() => {
  if (cardPalette) cardPalette.value = props.palette
})

onBeforeUnmount(() => {
  if (cardPalette) cardPalette.value = 'lavender'
})
</script>

<style scoped lang="scss">
.meta-card-background {
  position: absolute;
  inset: 0;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
  }
}
</style>
