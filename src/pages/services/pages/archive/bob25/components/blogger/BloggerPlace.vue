<template>
  <h3 class="place mt-font" :class="blogger">{{ bloggerPlaces[blogger] }}</h3>
</template>

<script setup lang="ts">
import '@/styles/mtfont.scss'
import { bloggerPlaces } from '../bloggerNames'

defineProps<{ blogger: keyof typeof bloggerPlaces }>()
</script>

<style scoped lang="scss">
.place {
  --outer-glow: var(--glow);

  position: absolute;
  inset-inline: 0;
  bottom: 30%;
  margin: 0;
  text-align: center;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 2px white;
  font-weight: bold;
  user-select: none;

  filter:
    drop-shadow(0 0 0.3905rem var(--glow)) drop-shadow(0 0 0.3905rem var(--glow)) drop-shadow(0 0 2.18675rem var(--glow)) drop-shadow(0 0 1.1715rem var(--outer-glow));

  &.jove {
    --glow: #e01a1b;
    --outer-glow: #d50c4f;
  }

  &.lebwa {
    --glow: #f58f23;
  }

  &.yusha {
    --glow: #1b99e5;
  }

  &.nearyou {
    --glow: #d50cd5;
  }
}
</style>
