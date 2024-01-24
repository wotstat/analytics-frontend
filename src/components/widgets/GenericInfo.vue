<template>
  <div class="text-center">
    <p class="card-main-info" :class="color">{{ processor ? processor(data) : data }}</p>
    <p class="card-main-info description">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { query } from '@/db';
import { computedAsync } from '@vueuse/core';
import { useTweenCounter } from '@/composition/useTweenCounter';

const props = defineProps<{
  query: string,
  description: string,
  color: 'orange' | 'green' | 'red' | 'blue' | 'yellow' | 'gold',
  processor?: (data: any) => string,
}>()

const dataDB = computedAsync(async () => {
  const response = await query<{ data: number }>(props.query);

  return response.data[0].data;
}, 0)

const data = useTweenCounter(dataDB, {
  fixedValue: props.processor ? 10 : 0
});

</script>