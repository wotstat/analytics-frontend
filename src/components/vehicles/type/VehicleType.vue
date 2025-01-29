<template>
  <component :is="targetComponent" />
</template>


<script setup lang="ts">
import { computed } from 'vue'
import AT from './images/at-spg.svg'
import HT from './images/heavytank.svg'
import LT from './images/lighttank.svg'
import MT from './images/mediumtank.svg'
import SPG from './images/spg.svg'
import ANY from './images/vehicle-types.svg'


const props = defineProps<{
  type: 'MT' | 'LT' | 'HT' | 'AT' | 'SPG' | 'mediumtank' | 'lighttank' | 'heavytank' | 'at-spg' | 'spg' | 'any',
}>()

const targetComponent = computed(() => {
  switch (props.type) {
    case 'MT':
    case 'mediumtank':
      return MT
    case 'LT':
    case 'lighttank':
      return LT
    case 'HT':
    case 'heavytank':
      return HT
    case 'AT':
    case 'at-spg':
      return AT
    case 'SPG':
    case 'spg':
      return SPG
    default:
      return ANY
  }
})
</script>


<style lang="scss" scoped></style>