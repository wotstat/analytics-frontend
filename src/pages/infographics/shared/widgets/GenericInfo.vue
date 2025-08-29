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
import { ref, computed, watch } from 'vue'
import { useElementVisibility } from '@vueuse/core'
import { Status } from '@/db'
import ServerStatusWrapper from '../ServerStatusWrapper.vue'
import { Tween } from '@/composition/tween/useTweenRef'


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


const value = computed(() => {
  const v = isStatusValue(props.value) ? props.value.data : props.value

  if (Array.isArray(v)) {
    if (v.some(v => typeof v !== 'number')) {
      console.error('GenericInfo: value must be a number or an array of numbers', props)
      return v.map(t => typeof t === 'number' ? t : 0) as number[]
    }
  } else {
    if (typeof v !== 'number') {
      console.error('GenericInfo: value must be a number or an array of numbers', props)
      return 0
    }
  }

  return v
})

const status = computed(() => props.status || (isStatusValue(props.value) ? props.value.status : undefined))

const arrayMappedValue = computed(() => (Array.isArray(value.value) ? value.value : [value.value]) as number[])

const resultValues = ref(arrayMappedValue.value)
const tweeners: Tween[] = []

watch(arrayMappedValue, (newValue, oldValue) => {
  const oldLength = oldValue?.length ?? 0
  const newLength = newValue.length

  if (oldLength !== newLength) {
    for (const tweener of tweeners) tweener.dispose()
    tweeners.length = 0

    for (let i = 0; i < newLength; i++) {
      tweeners.push(new Tween({
        get: () => resultValues.value[i],
        set: (value: number) => { resultValues.value[i] = value }
      }))
    }
  }

  if (visible.value) {
    for (let i = 0; i < tweeners.length; i++)  tweeners[i]!.to(arrayMappedValue.value[i], { duration: 1000 })
  }
}, { immediate: true })


watch(visible, (vis) => {
  if (!vis) return
  for (let i = 0; i < tweeners.length; i++) {
    tweeners[i]!.to(arrayMappedValue.value[i], { duration: 1000 })
  }
}, { immediate: true })


const data = computed(() => {
  if (Array.isArray(props.value))
    return (props.processor ? resultValues.value : resultValues.value.map(v => Number.parseFloat(v.toFixed(0)))) as T

  return (props.processor ? resultValues.value[0] : Number.parseFloat(resultValues.value[0].toFixed(0))) as T
})

// watchEffect(() => console.log('GenericInfo data:', arrayMappedValue.value, props, data.value, resultValues.value[0]))

function isStatusValue(value: T | { status: Status, data: T }): value is { status: Status, data: T } {
  return value != null && typeof value == 'object' && 'status' in value && 'data' in value
}

</script>


<style lang="scss" scoped>
.card-main-info.error {
  cursor: pointer;
}
</style>