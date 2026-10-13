<template>
  <div ref="container" class="scaled-card" :style="{ aspectRatio: `${size.width} / ${size.height}` }">
    <CardSurface :key="`${context.url}:${context.format}`" :context :style="{ transform: `scale(${scale})` }" />
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'
import CardSurface from '@/meta/cards/CardSurface.vue'
import { formats, type RenderContext } from '@/meta/utils'

const props = defineProps<{ context: RenderContext }>()
const container = useTemplateRef<HTMLDivElement>('container')
const { width } = useElementSize(container)
const size = computed(() => formats[props.context.format])
const scale = computed(() => width.value / size.value.width)
</script>

<style scoped lang="scss">
.scaled-card {
  width: 100%;
  overflow: hidden;
  background: #303236;

  :deep(.meta-card-surface) {
    transform-origin: left top;
  }
}
</style>
