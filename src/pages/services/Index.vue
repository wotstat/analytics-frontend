<template>
  <SectionLayout :title="String(route.meta.customTitle ?? '')" :sections>
    <RouterView v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </SectionLayout>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SectionLayout from '@/pages/shared/sidebarLayout/SectionLayout.vue'

const route = useRoute()
const links = [
  { to: '/services/vehicles', label: 'Статистика техники' },
  { to: '/services/mastery', label: 'Мастера' },
  { to: '/services/marks', label: 'Отметки' },
]
const sections = [
  { id: 'main', links },
  { id: 'utility', title: 'Служебная', links },
]
</script>
