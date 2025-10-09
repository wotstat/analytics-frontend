<template>
  <FallbackImg :src="targetUrl" :fallback="fallback ?? FallbackImage" />
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { minimapUrl } from '../../arenas'
import FallbackImg from '@/shared/uiKit/fallbackImg/FallbackImg.vue'
import { GameVendor } from '../../../wot'

import FallbackImage from './fallback.webp'


const props = defineProps<{
  tag: string
  game?: GameVendor
  gameplay?: null | 'comp7' | (string & {})
  format?: 'webp' | 'png'
  fallback?: string
}>()

const targetUrl = computed(() => minimapUrl(props.tag, props.game, props.gameplay, props.format))
</script>


<style lang="scss" scoped>
img {
  pointer-events: none;
  user-select: none;
  aspect-ratio: 1 / 1;
}
</style>