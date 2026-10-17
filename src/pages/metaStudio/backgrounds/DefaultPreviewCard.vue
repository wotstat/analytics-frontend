<template>
  <MetaCard
    class="default-preview-card"
    :variant
    subtitle="Статистика и аналитика танковых боёв"
    footer="Мир танков · World of Tanks">
    <template #title>
      WotStat
      <br>
      <span class="secondary-title">Analytics</span>
    </template>
    <template #background><slot name="background" /></template>
  </MetaCard>
</template>

<script setup lang="ts">
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'
import type { MetaCardVariant } from '@/shared/ui/meta/components/utils/variants'

defineProps<{ variant: MetaCardVariant }>()
</script>

<style scoped lang="scss">
.default-preview-card .secondary-title {
  color: var(--meta-card-muted);
}
</style>
