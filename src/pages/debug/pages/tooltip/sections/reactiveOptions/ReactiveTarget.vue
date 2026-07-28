<template>
  <button class="debug-btn" v-reactive-tooltip:reactive.instant="{
    title: 'Параметры приходят из опций',
    lines: ['значение биндинга не меняется', 'поэтому пересоздания быть не должно'],
  }">{{ label }}</button>
</template>


<script setup lang="ts">
import { vReactiveTooltip } from './reactiveTooltip'

// Проп статичный: пока он не меняется, Vue не патчит этот компонент,
// и хук updated директивы не вызывается.
defineProps<{
  label: string
}>()

</script>
