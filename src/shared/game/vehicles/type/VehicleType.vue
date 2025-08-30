<template>
  <component :is="targetComponent" />
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { VehicleType, vehicleTypeToImage } from './vehicleTypeToImage'


const props = defineProps<{
  type: VehicleType,
}>()

const targetComponent = computed(() => vehicleTypeToImage(props.type))
</script>


<style lang="scss" scoped></style>