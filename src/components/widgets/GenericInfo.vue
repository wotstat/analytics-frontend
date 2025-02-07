<template>
  <ServerStatusWrapper :status v-slot="{ showError, status }">
    <div class="text-center" ref="main">
      <p class="card-main-info nowrap" v-if="status != 'error'" :class="[color, status]">
        {{ processor ? processor(data) : data }}<span v-if="miniProcessor" class="mini-description">
          {{ miniProcessor(data) }}
        </span>
        <span v-else-if="miniData" class="mini-description">
          {{ miniData }}
        </span>
      </p>

      <p v-else class="card-main-info error" @click="showError">!</p>

      <p class="card-main-info description">{{ description }}</p>
    </div>
  </ServerStatusWrapper>
</template>

<script setup lang="ts" generic="T extends number | number[]">
import { useTweenCounter } from '@/composition/useTweenCounter';
import { toRef, type Ref, ref, computed } from 'vue';
import { useElementVisibility } from '@vueuse/core';
import { Status } from '@/db';
import ServerStatusWrapper from '../ServerStatusWrapper.vue';


const main = ref<HTMLElement | null>(null)
const visible = useElementVisibility(main)

const props = defineProps<{
  description: string,
  value: T | { status: Status, data: T },
  miniData?: string,
  status?: Status,
  color: 'orange' | 'green' | 'red' | 'blue' | 'yellow' | 'gold',
  processor?: (data: T) => string,
  miniProcessor?: (data: T) => string,
}>()


const value = computed(() => isStatusValue(props.value) ? props.value.data : props.value)
const status = computed(() => props.status || (isStatusValue(props.value) ? props.value.status : undefined))

const data = useTweenCounter(value, {
  fixedValue: props.processor ? 10 : 0,
  enabled: visible,
});


function isStatusValue(value: T | { status: Status, data: T }): value is { status: Status, data: T } {
  return value != null && typeof value == 'object' && 'status' in value && 'data' in value
}

</script>


<style lang="scss" scoped>
.card-main-info.error {
  cursor: pointer;
}
</style>