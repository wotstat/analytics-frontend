<template>
  <img
    ref="imgRef"
    :alt="alt"
    @error="onError"
    :loading="loading"
    :style="{ objectFit: 'cover' }"
  />
</template>


<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { isUrlMayValidImage, onErrorWithUrl } from './store'

const props = defineProps<{
  src: string
  alt?: string
  fallback?: string
  loading?: 'lazy' | 'eager'
}>()

const imgRef = ref<HTMLImageElement | null>(null)

function setSrc(url: string) {
  const img = imgRef.value
  if (img) img.src = url
}

function updateSrc() {
  setSrc(
    isUrlMayValidImage(props.src)
      ? props.src
      : props.fallback ?? props.src
  )
}

onMounted(updateSrc)
watch(() => props.src, updateSrc)

function onError(event: Event) {
  if (!props.fallback) return
  const img = event.target as HTMLImageElement
  if (img.src === props.fallback) return
  img.src = props.fallback
  onErrorWithUrl(props.src)
}
</script>

