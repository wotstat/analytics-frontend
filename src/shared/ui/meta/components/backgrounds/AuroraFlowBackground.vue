<template>
  <MetaCardBackground v-bind="props" palette="violet" class="background-aurora-flow" />
</template>

<script setup lang="ts">
import MetaCardBackground from '../MetaCardBackground.vue'
import type { MetaCardPatternProps } from '../utils/pattern'

const props = withDefaults(defineProps<MetaCardPatternProps>(), { pattern: 'noise' })
</script>

<style scoped lang="scss">
.background-aurora-flow {
  background: linear-gradient(125deg, #17212d, #22293b);

  &::before {
    inset: -120px;
    background: linear-gradient(145deg,
        #325c6900 18%, #325c694d 34%, #426c7b73 44%, #655c9273 56%, #7b56704d 67%, #7b567000 88%);
    filter: blur(72px);
  }
}
</style>
