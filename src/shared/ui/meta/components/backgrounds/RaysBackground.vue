<template>
  <MetaCardBackground v-bind="props" palette="blue" class="background-rays" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-rays {
  background: linear-gradient(120deg, #1c2632, #26394a);

  &::before {
    background:
      linear-gradient(122deg, transparent 45%, #a5c5df0d 45%, #a5c5df0d 60%, transparent 60%),
      linear-gradient(122deg, transparent 65%, #a5c5df14 65%, #a5c5df14 76%, transparent 76%),
      linear-gradient(122deg, transparent 81%, #10192340 81%);
  }
}
</style>
