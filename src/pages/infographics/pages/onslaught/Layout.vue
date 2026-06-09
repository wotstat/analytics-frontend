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
import { RouterView, useRoute } from 'vue-router'

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
  border: 1px solid #353535;
}
</style>