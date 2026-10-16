<template>
  <MetaCard variant="content" class="compare-card" :background label="Статистика техники" footer="Статистика. Динамика. Сравнение.">
    <template v-if="$slots.background" #background><slot name="background" /></template>
    <h1>Здесь будет<br>сравнение техники</h1>
  </MetaCard>
</template>

<script setup lang="ts">
import type { RenderContext } from '@/meta/utils'
import type { Component } from 'vue'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'

defineProps<{ context: RenderContext, background?: Component }>()
</script>

<style scoped lang="scss">
.compare-card {
  h1 {
    margin: 0;
    font-size: 76px;
    font-weight: 700;
    line-height: 1.1;
  }
}
</style>
