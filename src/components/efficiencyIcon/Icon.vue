<template>
  <component :is="iconByName.get(props.icon)" />
</template>


<script setup lang="ts">
import { IconType } from './utils';

const icons = import.meta.glob('./assets/*.svg', { eager: true });
const iconByName = new Map(Object.entries(icons).map(([key, value]) => [key.replace('./assets/', '').replace('.svg', ''), value]));

const props = defineProps<{ icon: IconType }>()
</script>


<style lang="scss" scoped></style>