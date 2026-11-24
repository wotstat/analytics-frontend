<template>
  <span ref="label" class="metric-label">{{ text }}</span>
</template>

<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import { useHasScroll } from '@/shared/composition/useHasScroll'

defineProps<{
  text: string
}>()

const emit = defineEmits<{ overflow: [value: boolean] }>()
const label = useTemplateRef<HTMLElement>('label')
const { hasScrollX } = useHasScroll(label)

watch(hasScrollX, value => emit('overflow', value), { immediate: true })
</script>

<style scoped lang="scss">
.metric-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
