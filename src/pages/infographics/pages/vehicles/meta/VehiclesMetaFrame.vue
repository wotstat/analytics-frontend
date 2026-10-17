<template>
  <MetaCard variant="compact" class="vehicles-meta-frame" specific-brand="ТЕХНИКА" :label :background>
    <template v-if="$slots.background" #background>
      <slot name="background" />
    </template>
    <slot />
    <template #footer />
  </MetaCard>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'

defineProps<{ label: string, background?: Component }>()
</script>

<style scoped lang="scss">
.vehicles-meta-frame {
  --meta-card-padding: 32px 48px 0;
  gap: 24px;

  :deep(.heading) {
    padding-bottom: 19px;
  }

  :deep(.content-body) {
    justify-content: flex-start;
  }
}
</style>
