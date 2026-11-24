<template>
  <MapFilters v-model="filters" />
  <MapComparison v-model="compared" :regions="filters.regions" />
  <MapTable :filters :compared-tags="comparedTags" @compare="toggleComparison" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBackground } from '@/shared/uiKit/pageBackground/useBackground'
import { comparisonColor } from '../shared/comparison/palette'
import StatisticsBackground from '../shared/StatisticsBackground.vue'
import MapComparison from './comparison/MapComparison.vue'
import MapFilters from './filters/MapFilters.vue'
import { createMapFilters } from './filters/mapFilters'
import MapTable from './table/MapTable.vue'

useBackground(StatisticsBackground, { backgroundKey: 'services-vehicles' })

const filters = ref(createMapFilters())
const compared = ref<{ tag: string, name: string, color: string }[]>([])
const comparedTags = computed(() => new Set(compared.value.map(item => item.tag)))

function toggleComparison(tag: string, name: string) {
  if (comparedTags.value.has(tag)) {
    compared.value = compared.value.filter(item => item.tag !== tag)
    return
  }

  const colors = new Set(compared.value.map(item => item.color))
  let index = 0
  while (colors.has(comparisonColor(index))) index++
  compared.value = [...compared.value, { tag, name, color: comparisonColor(index) }]
}
</script>
