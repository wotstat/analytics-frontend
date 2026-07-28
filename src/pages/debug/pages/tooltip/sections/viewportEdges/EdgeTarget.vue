<template>
  <button class="debug-btn" v-edge-tooltip="{ label }">{{ label }}</button>
</template>


<script setup lang="ts">
import { vEdgeTooltip } from './edgeTooltip'

defineProps<{
  label: string
}>()

</script>
