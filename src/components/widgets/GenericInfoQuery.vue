<template>
  <GenericInfo :value="value" :description="description" :miniData="miniData" :color="color" :processor="processor"
    :miniProcessor="miniProcessor" ref="container" />
</template>

<script setup lang="ts">
import { queryAsyncFirst } from '@/db';
import GenericInfo from './GenericInfo.vue';
import { computed, ref } from 'vue';
import { useElementVisibility } from '@vueuse/core';

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);

const props = defineProps<{
  query: string,
  description: string,
  miniData?: string,
  color: 'orange' | 'green' | 'red' | 'blue' | 'yellow' | 'gold',
  processor?: (data: any) => string,
  miniProcessor?: (data: any) => string,
}>()

const dataDB = queryAsyncFirst(props.query, { data: 0 }, visible);
const value = computed(() => dataDB.value.data);

</script>
