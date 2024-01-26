<template>
  <GenericInfo :value="dataDB" :description="description" :miniData="miniData" :color="color" :processor="processor"
    :miniProcessor="miniProcessor" />
</template>

<script setup lang="ts">
import { query } from '@/db';
import GenericInfo from './GenericInfo.vue';
import { computedAsync } from '@vueuse/core';

const props = defineProps<{
  query: string,
  description: string,
  miniData?: string,
  color: 'orange' | 'green' | 'red' | 'blue' | 'yellow' | 'gold',
  processor?: (data: any) => string,
  miniProcessor?: (data: any) => string,
}>()

const dataDB = computedAsync(async () => {
  const { data } = await query<{ data: number }>(props.query);
  return data[0].data;
}, 0)

</script>
