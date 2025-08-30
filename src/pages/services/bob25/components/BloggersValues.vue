<template>
  <p v-for="value in values" class="nowrap" :class="{
    'min': colorize && value === (lessIsBetter ? max : min),
    'max': colorize && value === (lessIsBetter ? min : max),
  }">
    <TweenValue :value :options :processor :raw :space :precision />
  </p>
</template>


<script setup lang="ts" generic="T">
import TweenValue from '@/components/tween/TweenValue.vue'
import { TweenOptions } from '@/composition/tween/useTweenRef'
import { computed } from 'vue'

const props = defineProps<{
  values: number[]
  options?: TweenOptions
  processor?: (value: number) => T
  raw?: boolean
  space?: boolean
  precision?: number
  colorize?: boolean
  lessIsBetter?: boolean
}>()


const max = computed(() => Math.max(...props.values))
const min = computed(() => Math.min(...props.values))

</script>


<style lang="scss" scoped>
.min {
  color: rgb(255, 212, 207);
}

.max {
  color: rgb(210, 255, 212);
}
</style>