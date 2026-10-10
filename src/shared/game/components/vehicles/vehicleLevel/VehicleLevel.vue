<template>
  <p class="mt-font">{{ romanNumberProcessor(level) }}</p>
</template>


<script setup lang="ts">
import { romanNumberProcessor } from '@/shared/utils/processors/processors'


const props = defineProps<{
  level: number
}>()

</script>


<style lang="scss" scoped></style>