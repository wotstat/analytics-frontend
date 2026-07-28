<template>
  <label class="debug-control">
    <span class="debug-label">{{ label ?? 'game' }}</span>
    <select v-model="game">
      <option value="mt">mt (Мир танков)</option>
      <option value="wot">wot (World of Tanks)</option>
    </select>
  </label>
</template>


<script setup lang="ts">
import { GameVendor } from '@/shared/game/wot'

defineProps<{
  label?: string
}>()

const game = defineModel<GameVendor>({ required: true })
</script>
