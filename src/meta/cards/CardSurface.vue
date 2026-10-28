<template>
  <div class="meta-card-surface" :style="{ width: `${size.width}px`, height: `${size.height}px` }">
    <slot>
      <component v-if="context && component" :is="component" v-bind="context.meta.props" :context />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { formats, renderContextKey, type MetaFormat, type RenderContext } from '../utils'
import { metaDefinitions } from '../definitions'
import { metaReadyKey } from './useMetaReady'

const props = withDefaults(defineProps<{ context?: RenderContext, format?: MetaFormat }>(), {
  format: 'og',
})
const size = computed(() => formats[props.context?.format ?? props.format])
const component = computed(() => metaDefinitions.find(item => item.id === props.context?.meta.definitionId)?.component)
provide(renderContextKey, computed(() => props.context))

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
