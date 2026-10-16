<template>
  <IconRenderer :icon="props.icon" />
</template>


<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { IconType } from './utils'

const IconRenderer = defineAsyncComponent(() => import('./IconRenderer.vue'))

const props = defineProps<{ icon: IconType }>()
</script>
