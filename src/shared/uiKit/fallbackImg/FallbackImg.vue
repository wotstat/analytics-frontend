<template>
  <img ref="imgRef" :src="initSrc" :alt="alt" @error="onError" :loading="loading" />
</template>


<script setup lang="ts">
import { watch, onMounted, useTemplateRef } from 'vue'
import { isUrlMayValidImage, onErrorWithUrl } from './store'

const props = defineProps<{
  src: string
  alt?: string
  fallback?: string
  loading?: 'lazy' | 'eager'
}>()

const imgRef = useTemplateRef<HTMLImageElement>('imgRef')
const initSrc = isUrlMayValidImage(props.src) ? props.src : props.fallback ?? props.src

function setSrc(url: string) {
  const img = imgRef.value
  if (img && img.src !== url) img.src = url
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

function onError() {
  if (!props.fallback) return
  if (imgRef.value?.src === props.fallback) return
  setSrc(props.fallback)
  onErrorWithUrl(props.src)
}
</script>
