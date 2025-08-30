<template>
  <p class="mt-font">{{ numberToRoman(level) }}</p>
</template>


<script setup lang="ts">
import { numberToRoman } from '@/utils'

const props = defineProps<{
  level: number
}>()

</script>


<style lang="scss" scoped></style>