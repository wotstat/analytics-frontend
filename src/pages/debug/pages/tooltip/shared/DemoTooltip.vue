<template>
  <div class="demo-tooltip">
    <div class="title">{{ title }}</div>
    <div class="line" v-for="(line, index) in lines ?? []" :key="index">{{ line }}</div>
    <div class="alive">жив {{ alive }} мс</div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'

defineProps<{
  title: string
  lines?: string[]
}>()

// Счётчик жизни — способ увидеть, пересоздалось содержимое или только переехало:
// смена реактивной опции сохраняет экземпляр, смена значения биндинга — нет.
const mounted = performance.now()
const alive = ref(0)

useIntervalFn(() => alive.value = Math.round((performance.now() - mounted) / 100) * 100, 100)

</script>


<style scoped lang="scss">
.demo-tooltip {
  padding: 6px 9px;
  font-size: 13px;
  line-height: 1.35;
  max-width: 280px;

  .title {
    font-weight: var(--bold-weight);
  }

  .line {
    color: #ffffffb0;
  }

  .alive {
    margin-top: 3px;
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--blue-thin-color);
  }
}
</style>
