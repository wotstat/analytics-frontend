<template>
  <div class="meta-card-surface" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
    <component v-if="component" :is="component" :context />
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { formats, type RenderContext } from '../utils'
import { metaDefinitions } from '../resolver'
import { metaReadyKey } from './useMetaReady'

const props = defineProps<{ context: RenderContext }>()
const size = computed(() => formats[props.context.format])
const component = computed(() => metaDefinitions.find(item => item.id === props.context.meta.definitionId)?.component)

const preparations: Promise<void>[] = []
provide(metaReadyKey, ready => {
  preparations.push(ready)
  // Обычные превью не вызывают waitUntilReady; ошибки остаются доступны renderer.
  void ready.catch(() => {})
})

defineExpose({
  waitUntilReady: async () => { await Promise.all(preparations) },
})
</script>

<style scoped lang="scss">
.meta-card-surface {
  flex: none;
  line-height: normal;
  font-weight: 400;
  color-scheme: normal;
  font-synthesis: auto;
  text-rendering: auto;
  -webkit-font-smoothing: auto;
  -moz-osx-font-smoothing: auto;
  overflow: hidden;
  font-family: Arial, Helvetica, sans-serif;
  text-align: left;

  :deep(br) {
    display: inline;
    margin: 0;
  }

  &, :deep(*) {
    box-sizing: border-box;
  }
}
</style>
