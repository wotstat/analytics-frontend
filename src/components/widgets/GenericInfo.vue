<template>
  <div class="text-center" ref="main">
    <p class="card-main-info" :class="color">{{ processor ? processor(data) : data }}<span v-if="miniProcessor"
        class="mini-description">{{ miniProcessor(data) }}</span>
      <span v-else-if="miniData" class="mini-description">{{
        miniData }}</span>
    </p>
    <p class="card-main-info description">{{ description }}</p>
  </div>
</template>

<script setup lang="ts" generic="T extends number | number[]">
import { useTweenCounter } from '@/composition/useTweenCounter';
import { toRef, type Ref, ref } from 'vue';
import { useElementVisibility } from '@vueuse/core';

const main = ref<HTMLElement | null>(null)
const visible = useElementVisibility(main)

const props = defineProps<{
  description: string,
  value: T
  miniData?: string,
  color: 'orange' | 'green' | 'red' | 'blue' | 'yellow' | 'gold',
  processor?: (data: T) => string,
  miniProcessor?: (data: T) => string,
}>()

const data = useTweenCounter(toRef(props, 'value') as Ref<T>, {
  fixedValue: props.processor ? 10 : 0,
  enabled: visible,
});

</script>
