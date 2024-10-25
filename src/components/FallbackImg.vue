<template>
  <img :src="src" :alt="alt" @error.once="onError">
</template>


<script setup lang="ts">
const props = defineProps<{
  src: string
  alt?: string
  fallback?: string
}>()

function onError(event: Event) {
  if (props.fallback) {
    const target = event.target as HTMLImageElement
    target.src = props.fallback
  }
}
</script>