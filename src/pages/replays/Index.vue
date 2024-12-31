<template>
  <SidebarLayout :links>

    <template #sidebar>
      <div class="sticky-sidebar router-links">
        <QueryPreserveRouterLink to="/replays">Поиск реплеев</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/replays/analyze">Локальный анализ</QueryPreserveRouterLink>
        <hr>
        <button class="upload-replay">
          <p>Загрузить реплей</p>
        </button>
      </div>
    </template>

    <template #content-top>
      <h1>content-top</h1>
    </template>

    <template #default>
      <h1>Main content</h1>
    </template>
  </SidebarLayout>
</template>

<script setup lang="ts">

import QueryPreserveRouterLink from '@/components/QueryPreserveRouterLink.vue';
import SidebarLayout from '@/components/SidebarLayout/Index.vue'
import { SidebarLink } from '@/components/SidebarLayout/types';

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
</style>