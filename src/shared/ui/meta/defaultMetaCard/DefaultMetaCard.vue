<template>
  <MetaCard
    class="default-card"
    :background
    :variant
    :heading
    :label
    :subtitle
    :footer>
    <template #title>
      <template v-if="title">{{ title }}</template>
      <template v-else>
        WotStat
        <br>
        <span class="secondary-title">Analytics</span>
      </template>
    </template>
    <template v-if="$slots.background" #background><slot name="background" /></template>
  </MetaCard>
</template>

<script setup lang="ts">
import type { RenderContext } from '@/meta/utils'
import type { Component } from 'vue'
import MetaCard from '../components/MetaCard.vue'
import type { MetaCardVariant } from '../components/utils/variants'

withDefaults(defineProps<{
  context: RenderContext
  title?: string
  subtitle?: string
  heading?: string
  label?: string
  footer?: string
  background?: Component
  variant?: MetaCardVariant
}>(), {
  subtitle: 'Статистика и аналитика танковых боёв',
  footer: 'Мир танков · World of Tanks',
})
</script>

<style scoped lang="scss">
.default-card .secondary-title {
  color: var(--meta-card-muted);
}
</style>
