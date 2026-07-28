<template>
  <label class="debug-control">
    <span class="debug-label">{{ label }}</span>
    <select v-model="rank">
      <option v-for="r in RANKS" :key="r" :value="r">{{ r }}</option>
    </select>
  </label>
</template>


<script setup lang="ts">
import { Rank } from '@/shared/game/comp7/utils'

defineProps<{
  label: string
}>()

// Порядок повторяет rankOrder внутри compareRanks() в utils.ts (он там не экспортирован).
const RANKS: Rank[] = ['qual', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']

const rank = defineModel<Rank>({ required: true })
</script>
