<template>
  <MetaCardBackground v-bind="props" palette="blue" class="background-diagonal" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = defineProps<MetaCardPatternProps>()
</script>

<style scoped lang="scss">
.background-diagonal {
  background:
    radial-gradient(ellipse 90% 130% at 0% 0%, #344b61 0%, #29384680 42%, transparent 78%),
    linear-gradient(145deg, #252e39, #141b23 88%);

  &::before {
    background: linear-gradient(145deg, transparent 20%, #11182033 68%, #10161d66);
  }
}
</style>
