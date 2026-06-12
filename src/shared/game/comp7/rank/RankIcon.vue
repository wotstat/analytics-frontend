<template>
  <FallbackImg :src="targetUrl" :key="targetUrl" :fallback="fallbackUrl" :loading class="rank-icon"
    :class="`season-${props.season ?? 'latest'} game-${props.game ?? 'mt'} size-${props.size ?? 'medium'}`" />
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

.game-mt {
  &.season-comp7_5_4 {
    &.size-large {
      transform: translateY(6%) scale(1.15);
    }

    &.size-medium {
      transform: translateY(4%) scale(1.15);
    }

    &.size-small {
      transform: translateY(7%) scale(1.15);
    }
  }
}
</style>