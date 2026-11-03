<template>
  <SidebarLayout :links>
    <template #content-top>
      <h1 class="main-title">{{ route.meta.customTitle }}</h1>
    </template>

    <RouterView v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </SidebarLayout>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SidebarLayout from '@/pages/shared/sidebarLayout/SidebarLayout.vue'
import type { SidebarLink } from '@/pages/shared/sidebarLayout/utils'

const route = useRoute()
const links: SidebarLink[] = [
  { to: '/services/vehicles', labels: 'Статистика техники', shortLabel: 'Техника' },
  { to: '/services/mastery', labels: 'Мастера' },
  { to: '/services/marks', labels: 'Отметки' },
]
</script>

<style scoped lang="scss">
@use '/src/styles/mixins.scss' as *;

.main-title {
  margin: 0;

  @include less-x-small {
    font-size: 1.8rem;
  }
}
</style>
