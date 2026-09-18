<template>
  <SidebarLayout :links>

    <template #sidebar>
      <div class="sticky-sidebar router-links">
        <QueryPreserveRouterLink to="/onslaught" v-new-feature-badge="'onslaught-general'">
          Общее
        </QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/onslaught/personal">Статистика</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/onslaught/leaderboard">Таблица лидеров</QueryPreserveRouterLink>
      </div>
    </template>

    <template #content-top></template>

    <template #default>
      <RouterView></RouterView>
      <hr class="footer">
    </template>
  </SidebarLayout>
</template>

<script setup lang="ts">

import QueryPreserveRouterLink from '@/pages/shared/sidebarLayout/QueryPreserveRouterLink.vue'
import SidebarLayout from '@/pages/shared/sidebarLayout/SidebarLayout.vue'
import { SidebarLink } from '@/pages/shared/sidebarLayout/utils'
import { setFeatureVisit, vNewFeatureBadge } from '@/shared/uiKit/newFeatureBadge/newFeatureBadge'
import { RouterView } from 'vue-router'
import { useBackground } from '@/shared/uiKit/pageBackground/useBackground'
import OnslaughtBackground from './OnslaughtBackground.vue'

const links: SidebarLink[] = [
  { to: '/onslaught', labels: 'Общее' },
  { to: '/onslaught/personal', labels: 'Персональная' },
  { to: '/onslaught/leaderboard', labels: 'Таблица лидеров' },
]

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
.router-links {
  display: flex;
  flex-direction: column;

  :deep(.new-feature-badge) {
    position: relative;

    &::before {
      position: absolute;
      content: 'NEW';
      top: -5px;
      left: -2px;
      padding: 1px 3px;
      border-radius: 20px;
      background-color: #2f80ed;
      font-size: 10px;
      font-weight: bold;
      line-height: 1;
    }
  }
}

.footer {
  margin-top: 200px;
  margin-bottom: 50px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

</style>
