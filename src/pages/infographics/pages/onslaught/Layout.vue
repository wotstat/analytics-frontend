<template>
  <SidebarLayout :links>

    <template #sidebar>
      <div class="sticky-sidebar router-links">
        <QueryPreserveRouterLink to="/onslaught/personal">Статистика</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/onslaught/leaderboard">Таблица лидеров</QueryPreserveRouterLink>
      </div>
    </template>

    <template #content-top></template>

    <template #default>
      <img src="./assets/bg-1.jpeg" alt="background" class="background">
      <RouterView></RouterView>
      <hr class="footer">
    </template>
  </SidebarLayout>
</template>

<script setup lang="ts">

import QueryPreserveRouterLink from '@/pages/shared/sidebarLayout/QueryPreserveRouterLink.vue'
import SidebarLayout from '@/pages/shared/sidebarLayout/SidebarLayout.vue'
import { SidebarLink } from '@/pages/shared/sidebarLayout/utils'
import { setFeatureVisit } from '@/shared/uiKit/newFeatureBadge/newFeatureBadge'
import { RouterView } from 'vue-router'

const links: SidebarLink[] = [
  { to: '/onslaught/personal', labels: 'Персональная' },
  { to: '/onslaught/leaderboard', labels: 'Таблица лидеров' },
]

setFeatureVisit('onslaught')

</script>

<style scoped lang="scss">
.router-links {
  display: flex;
  flex-direction: column;
}

.footer {
  margin-top: 200px;
  margin-bottom: 50px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  z-index: -1;

  filter: brightness(0.7);
  user-select: none;
  pointer-events: none;
}
</style>