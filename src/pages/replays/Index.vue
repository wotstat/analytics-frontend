<template>
  <SidebarLayout :links>

    <template #sidebar>
      <div class="sticky-sidebar router-links">
        <QueryPreserveRouterLink to="/replays">Поиск реплеев</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/replays/analyze">Локальный анализ</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/replays/my">Мои реплеи</QueryPreserveRouterLink>
        <hr>
        <button class="upload-replay">
          <p>Загрузить реплей</p>
        </button>
      </div>
    </template>

    <template #content-top>
      <h1>Реплеи</h1>
    </template>

    <template #default>
      <RouterView></RouterView>
    </template>
  </SidebarLayout>
</template>

<script setup lang="ts">

import QueryPreserveRouterLink from '@/components/QueryPreserveRouterLink.vue';
import SidebarLayout from '@/components/sidebarLayout/Index.vue'
import { SidebarLink } from '@/components/sidebarLayout/types';
import { RouterView } from 'vue-router';


const links: SidebarLink[] = [
  { to: '/replays', labels: 'Поиск реплеев' },
  { to: '/replays/analyze', labels: 'Локальный анализ' },
  'separator',
  { to: '/replays/upload', labels: 'Загрузить реплей' },
]

</script>

<style scoped lang="scss">
.router-links {
  display: flex;
  flex-direction: column;
}

.upload-replay {
  padding: 0.8em 0.4em;
  font-weight: bold;

  p {
    color: white;
    filter: drop-shadow(1px 0.03px 0px rgba(0, 0, 0, 0.8));
  }
}

h1 {
  margin: 0;
}
</style>