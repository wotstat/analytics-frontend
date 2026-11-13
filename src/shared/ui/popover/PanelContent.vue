<template>
  <slot v-if="scrollMode === 'child'" />
  <div v-else ref="content" class="panel-content nice-scrollbar"
    :class="{ compact: density === 'compact', 'has-scrollbar': hasScrollbar }" :style="contentStyle"
    @scroll="$emit('scroll', $event)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const props = withDefaults(defineProps<{
  density?: 'standard' | 'compact'
  scrollMode?: 'panel' | 'child'
  scrollbarOffsets?: [number, number]
}>(), {
  density: 'standard',
  scrollMode: 'panel',
  scrollbarOffsets: () => [10, 10],
})

defineEmits<{ scroll: [event: Event] }>()

const content = useTemplateRef<HTMLDivElement>('content')
const hasScrollbar = ref(false)
useResizeObserver(content, () => {
  hasScrollbar.value = !!content.value && content.value.offsetWidth > content.value.clientWidth
})

const contentStyle = computed(() => ({
  '--panel-scrollbar-track-start': `${props.scrollbarOffsets[0]}px`,
  '--panel-scrollbar-track-end': `${props.scrollbarOffsets[1]}px`,
}))
</script>

<style scoped lang="scss">
.panel-content {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--panel-padding);

  &.has-scrollbar {
    margin-right: 3px;
    padding-right: 3px;
  }

  &::-webkit-scrollbar-track {
    margin-block-start: var(--panel-scrollbar-track-start);
    margin-block-end: var(--panel-scrollbar-track-end);
  }

  :deep(.panel-section + .panel-section) {
    margin-top: 20px;
  }

  :deep(.panel-divider) {
    height: 0;
    margin: 12px 0;
    border: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  :deep(.panel-section > :is(h3, h4, h5)) {
    margin: 0 0 8px;
    color: var(--panel-heading-color, #fff);
    font-size: 14px;
    font-weight: 500;
  }

  :deep(.panel-section > h4) {
    font-size: 13px;
  }

  :deep(.panel-section > h5) {
    font-size: 12px;
  }

  :deep(.panel-note) {
    margin: 0;
    color: rgba(255, 255, 255, 0.55);
    font-size: 12px;
  }

  &.compact {
    :deep(.panel-section > :is(h3, h4, h5)) {
      margin-bottom: 6px;
      font-size: 12px;
    }

    :deep(.panel-section > h4) {
      font-size: 11px;
    }

    :deep(.panel-section > h5) {
      font-size: 10px;
    }
  }
}
</style>
