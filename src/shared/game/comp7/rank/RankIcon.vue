<template>
  <FallbackImg :src="targetUrl" :fallback="fallbackUrl" :loading class="rank-icon" />
</template>


<script setup lang="ts">
import FallbackImg from '@/shared/uiKit/fallbackImg/FallbackImg.vue'
import { GameVendor } from '../../wot'
import { RankImageDefinition, rankImageUrl } from '../utils'
import { computed } from 'vue'

const props = defineProps<{
  rank: RankImageDefinition
  game?: GameVendor
  season?: 'latest' | (string & {})
  size?: 'small' | 'medium' | 'large'
  loading?: 'lazy' | 'eager'
}>()

const targetUrl = computed(() => rankImageUrl(props.rank, props.size, props.game, props.season))
const fallbackUrl = computed(() => rankImageUrl(props.rank, props.size, props.game, 'latest'))
</script>


<style lang="scss" scoped>
.rank-icon {
  aspect-ratio: 1 / 1;
}
</style>