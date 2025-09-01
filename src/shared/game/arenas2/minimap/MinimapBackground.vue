<template>
  <FallbackImg :src="targetUrl" />
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { minimapUrl } from '../arenas'
import FallbackImg from '@/shared/uiKit/fallbackImg/FallbackImg.vue'


const props = defineProps<{
  tag: string
  game?: 'mt' | 'wot'
  format?: 'webp' | 'png'
}>()

const targetUrl = computed(() => minimapUrl(props.tag, props.game, props.format))
</script>


<style lang="scss" scoped>
img {
  pointer-events: none;
  user-select: none;
}
</style>