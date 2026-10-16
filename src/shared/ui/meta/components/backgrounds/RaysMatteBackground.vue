<template>
  <MetaCardBackground v-bind="props" palette="blue" class="background-rays-matte" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-rays-matte {
  background: linear-gradient(120deg, #20282f, #2b3942);

  &::before {
    background:
      linear-gradient(125deg, transparent 42%, #b2cbdd0a 44%, #b2cbdd14 53%, #b2cbdd08 59%, transparent 62%),
      linear-gradient(125deg, transparent 64%, #b2cbdd0d 67%, #b2cbdd1a 73%, #b2cbdd08 79%, transparent 82%),
      linear-gradient(125deg, transparent 84%, #111a2233 88%);
  }
}
</style>
