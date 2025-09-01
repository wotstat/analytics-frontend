<template>
  <CircleButton @click="emits('click')">
    <XIcon class="icon" />
  </CircleButton>
</template>


<script setup lang="ts">
import CircleButton from '../CircleButton.vue'

import XIcon from './x.svg'

const props = defineProps<{}>()
const emits = defineEmits<{
  (e: 'click'): void
}>()
</script>


<style lang="scss" scoped></style>