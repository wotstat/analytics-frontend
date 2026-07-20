<template>
  <FallbackImg :src="targetUrl" :key="targetUrl" :fallback="fallbackUrl" :loading class="skill-icon"
    :class="`season-${props.season ?? 'latest'} game-${props.game ?? 'mt'}`" />
</template>

<script setup lang="ts">
import FallbackImg from '@/shared/uiKit/fallbackImg/FallbackImg.vue'
import { skillImageUrl, SkillTag } from '../utils'
import { computed } from 'vue'
import { GameVendor } from '../../wot'

const props = defineProps<{
  skill: SkillTag | (string & {})
  game?: GameVendor
  season?: 'latest' | (string & {})
  loading?: 'lazy' | 'eager'
}>()


const targetUrl = computed(() => skillImageUrl(props.skill, props.game, props.season))
const fallbackUrl = computed(() => skillImageUrl(props.skill, props.game, 'latest'))
</script>

<style scoped lang="scss">
.skill-icon {
  aspect-ratio: 1 / 1;
  width: 100%;
}
</style>
