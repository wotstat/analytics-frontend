<template>
  <img :src="src" :alt="alt" @error="onError" :key="src">
</template>


<script setup lang="ts">
import { computed } from 'vue';
import { isUrlMayValidImage, onErrorWithUrl } from './store';

const props = defineProps<{
  src: string
  alt?: string
  fallback?: string
}>()

const target = computed(() => {

  return isUrlMayValidImage(props.src) ? props.src : props.fallback
})

function onError(event: Event) {
  if (!props.fallback) return
  const target = event.target as HTMLImageElement
  if (target.src === props.fallback) return
  target.src = props.fallback
  onErrorWithUrl(props.src)
}
</script>