<template>
  <VehicleFilters v-model="filters" />
  <div class="table">
    <VehicleListTable :slots />
  </div>
</template>



<script setup lang="ts">
import { ref } from 'vue'
import { useMeta } from '@/shared/composition/useMeta'
import VehicleListTable from './vehicleListTable/VehicleListTable.vue'
import { Slot } from './vehicleListTable/helpers.ts'
import VehicleFilters from './filters/VehicleFilters.vue'
import { createVehicleFilters } from './filters/types'

useMeta({
  title: 'Статистика танов',
  description: 'Статистика всех танков игры',
  keywords: 'статистика танов, статистика танов в боях, статистика танов в игре, статистика танов в world of tanks'
})

const filters = ref(createVehicleFilters())

const slots = ref<Slot[]>([
  { icon: 'battles' },
  { icon: 'player' },
  { icon: 'dmg' },
  { icon: 'assist' },
  { icon: 'tank' },
  { icon: 'xp' },
  { icon: 'lifetime' },
])


</script>
