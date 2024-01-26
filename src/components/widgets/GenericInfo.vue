<template>
  <div class="text-center">
    <p class="card-main-info" :class="color">{{ processor ? processor(data) : data }}<span v-if="miniProcessor"
        class="mini-description">{{ miniProcessor(data) }}</span>
      <span v-else-if="miniData" class="mini-description">{{
        miniData }}</span>
    </p>
    <p class="card-main-info description">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { useTweenCounter } from '@/composition/useTweenCounter';
import { toRef, type Ref } from 'vue';

const props = defineProps<{
  description: string,
  value: number
  miniData?: string,
  color: 'orange' | 'green' | 'red' | 'blue' | 'yellow' | 'gold',
  processor?: (data: number) => string,
  miniProcessor?: (data: number) => string,
}>()

const data = useTweenCounter(toRef(props, 'value'), {
  fixedValue: props.processor ? 10 : 0
});

</script>
