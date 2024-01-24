<template>
  <div>
    <p><span>{{ shots }}</span> выстрелов всего</p>
  </div>
</template>

<script setup lang="ts">
import { query } from '@/db';
import { computedAsync } from '@vueuse/core';

const shots = computedAsync(async () => {
  const response = await query<{ count: number }>('select count(*) as count from Event_OnShot');

  return response.data[0].count;
}, 0)

</script>