<template>
  <MetaCard
    class="default-card"
    :background
    :variant
    subtitle="Статистика и аналитика танковых боёв"
    footer="Мир танков · World of Tanks">
    <template #title>
      WotStat
      <br>
      <span class="secondary-title">Analytics</span>
    </template>
    <template v-if="$slots.background" #background><slot name="background" /></template>
  </MetaCard>
</template>

<script setup lang="ts">
import type { RenderContext } from '@/meta/utils'
import type { Component } from 'vue'
import MetaCard from '../components/MetaCard.vue'
import type { MetaCardVariant } from '../components/utils/variants'

defineProps<{ context: RenderContext, background?: Component, variant?: MetaCardVariant }>()
</script>

<style scoped lang="scss">
.default-card .secondary-title {
  color: var(--meta-card-muted);
}
</style>
