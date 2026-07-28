<template>
  <label class="debug-control">
    <span class="debug-label">{{ label ?? 'season' }}</span>
    <select v-model="season">
      <option v-for="s in SEASONS" :key="s" :value="s">{{ s }}</option>
    </select>
  </label>
</template>


<script setup lang="ts">
defineProps<{
  label?: string
}>()

// SEASON_LENGTHS/SEASON_SKILL_CHANGE в utils.ts не экспортированы — список id собран вручную по их ключам.
const SEASONS = ['latest', 'comp7_5_2', 'comp7_5_3', 'comp7_5_4']

const season = defineModel<string>({ required: true })
</script>
