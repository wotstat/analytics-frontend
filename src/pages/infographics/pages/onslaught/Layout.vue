<template>
  <SectionLayout :title="route.meta.customTitle ?? ''" :sections>
    <template #link-label="{ link }">
      <span v-if="link.to === '/onslaught'" class="general-label" v-new-feature-badge="'onslaught-general'">
        {{ link.label }}
      </span>
      <template v-else>{{ link.label }}</template>
    </template>

    <RouterView />
    <hr class="footer">
  </SectionLayout>
</template>

<script setup lang="ts">

import { RouterView, useRoute } from 'vue-router'
import SectionLayout from '@/pages/shared/sidebarLayout/SectionLayout.vue'
import { setFeatureVisit, vNewFeatureBadge } from '@/shared/uiKit/newFeatureBadge/newFeatureBadge'
import { useBackground } from '@/shared/uiKit/pageBackground/useBackground'
import OnslaughtBackground from './OnslaughtBackground.vue'

const route = useRoute()
const sections = [{
  id: 'main',
  links: [
    { to: '/onslaught', label: 'Общее' },
    { to: '/onslaught/personal', label: 'Персональная' },
    { to: '/onslaught/leaderboard', label: 'Таблица лидеров' },
  ],
}]

setFeatureVisit('onslaught')
useBackground(OnslaughtBackground)

</script>


<style lang="scss">
.comp7-tooltip {
  --popover-background-color: rgba(16, 29, 51, 1);
  --popover-border-color: rgb(40, 57, 85);
}
</style>

<style scoped lang="scss">
.general-label.new-feature-badge::after {
  display: inline-block;
  content: 'NEW';
  margin-left: 5px;
  padding: 1px 3px;
  border-radius: 20px;
  background-color: #2f80ed;
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
  vertical-align: middle;
}

.footer {
  margin-top: 200px;
  margin-bottom: 50px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}
</style>
