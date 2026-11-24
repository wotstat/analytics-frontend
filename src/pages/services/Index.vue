<template>
  <SectionLayout
    :title="route.meta.customTitle ?? ''"
    :title-class="route.meta.titleClass"
    :sections>
    <RouterView v-slot="{ Component }">
      <KeepAlive exclude="BattleOfBloggers2025">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </SectionLayout>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SectionLayout from '@/pages/shared/sidebarLayout/SectionLayout.vue'

const route = useRoute()
const sections = [
  {
    id: 'main',
    links: [
      { to: '/services/vehicles', label: 'Статистика техники' },
      { to: '/services/maps', label: 'Статистика карт' },
      { to: '/services/marks', label: 'Отметки' },
      { to: '/services/mastery', label: 'Мастера' },
    ],
  },
  {
    id: 'archive',
    title: 'Архив',
    links: [
      { to: '/services/compare-versions', label: 'Сравнение версий' },
      { to: '/services/bb25', label: 'Битва блогеров 2025' },
    ],
  },
]
</script>
