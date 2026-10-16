<template>
  <div class="meta-card-pattern" :class="`pattern-${kind}`" :style="{ backgroundImage: customImage, backgroundSize: patternSize }"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MetaCardPatternProps } from './utils/pattern'

const props = defineProps<MetaCardPatternProps>()
const kind = computed(() => {
  if (props.pattern === 'dots' || props.pattern === 'crosses' || props.pattern === 'noise') return props.pattern
  return 'custom'
})
const customImage = computed(() => {
  if (kind.value !== 'custom' || !props.pattern) return undefined
  const source = props.pattern.trimStart().startsWith('<svg')
    ? `data:image/svg+xml,${encodeURIComponent(props.pattern)}`
    : props.pattern
  return `url(${JSON.stringify(source)})`
})
</script>

<style scoped lang="scss">
.meta-card-pattern {
  position: absolute;
  inset: 0;
  background-position: center;
  background-repeat: repeat;
  background-size: cover;
  mask-image: linear-gradient(105deg, transparent 10%, #0007 45%, #000 100%);
  opacity: .7;

  &.pattern-dots {
    background-image: radial-gradient(circle, #c2d4e54d 1px, transparent 1.3px);
    background-size: 28px 28px;
    opacity: .5;
  }

  &.pattern-crosses {
    background-image: url('./assets/crosses.svg');
    background-size: auto;
  }

  &.pattern-noise {
    background-image: url('./assets/grain.svg');
    background-size: auto;
    mask-image: none;
    mix-blend-mode: soft-light;
    opacity: var(--meta-card-noise-opacity, .12);
  }
}
</style>
