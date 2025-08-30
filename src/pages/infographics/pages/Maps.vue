<template>
  <h2 class="page-title">Карты</h2>
  <div class="flex ver damage" ref="container">
    <div class="card">
      <MapsTable :params="params" />
    </div>
    <!-- <div class="card">
      <p>Наиболее дисбалансные по респам</p>
    </div>
    <div class="card">
      <p>Время боя по карте</p>
    </div> -->
  </div>
</template>



<script setup lang="ts">
import { ref } from 'vue'
import { useElementVisibility } from '@vueuse/core'
import MapsTable from '@/pages/infographics/shared/widgets/MapsTable.vue'
import { useQueryStatParams, whereClause } from '@/shared/query/useQueryStatParams'
import { useMeta } from '@/shared/composition/useMeta'

useMeta({
  title: 'Статистика карт',
  description: 'Статистика по карт в боях',
  keywords: 'статистика карт, статистика карт в боях, статистика карт в игре, статистика карт в world of tanks'
})


const container = ref<HTMLElement | null>(null)
const visible = useElementVisibility(container)
const params = useQueryStatParams()


</script>