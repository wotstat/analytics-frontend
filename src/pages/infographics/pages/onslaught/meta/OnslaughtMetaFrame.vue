<template>
  <MetaCard :variant class="onslaught-meta" specific-brand="НАТИСК" :label="`${params.region} · ${params.seasonName}`" :footer>
    <template #background>
      <MetaCardBackground palette="slate" class="onslaught-background">
        <img src="../assets/bg-1.jpg" alt="" loading="eager">
      </MetaCardBackground>
    </template>

    <div v-if="state === 'error' || state === 'empty'" class="empty-state">
      <p class="og-eyebrow">{{ section }}</p>
      <h2 v-if="state === 'error'">Не удалось загрузить статистику</h2>
      <h2 v-else>Пока нет данных за этот сезон</h2>
    </div>
    <slot v-else />
  </MetaCard>
</template>

<script setup lang="ts">
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'
import MetaCardBackground from '@/shared/ui/meta/components/MetaCardBackground.vue'
import type { MetaCardVariant } from '@/shared/ui/meta/components/utils/variants'
import type { OnslaughtMetaParams } from './utils/params'

withDefaults(defineProps<{
  variant?: MetaCardVariant
  params: OnslaughtMetaParams
  section: string
  footer: string
  state: 'loading' | 'ready' | 'empty' | 'error'
}>(), { variant: 'compact' })
</script>

<style scoped lang="scss">
.onslaught-meta {
  --onslaught-accent: #b4d3ff;

  .onslaught-background {
    background: #0c1423;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 32%;
      opacity: .22;
    }

    &::before {
      z-index: 1;
      background: radial-gradient(ellipse at 88% 60%, #5d9ce225, transparent 60%);
    }
  }

  :deep(.og-eyebrow) {
    margin: 0 0 18px;
    color: var(--meta-card-muted);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  :deep(.og-nickname) {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 54px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -1.5px;

    &.long {
      font-size: 42px;
    }
  }

  :deep(.og-number) {
    margin: 0;
    font-size: 100px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -4px;
    font-variant-numeric: tabular-nums;
  }

  :deep(.og-caption) {
    margin: 12px 0 0;
    color: var(--meta-card-muted);
    font-size: 24px;
    line-height: 1.35;
  }

  .empty-state h2 {
    max-width: 850px;
    margin: 0;
    font-size: 58px;
    line-height: 1.15;
  }
}
</style>
