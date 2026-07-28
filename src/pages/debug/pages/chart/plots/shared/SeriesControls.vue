<template>
  <div class="debug-row">
    <label class="debug-control" v-if="!hideSource">
      <span class="debug-label">источник</span>
      <select v-model="source">
        <option v-for="item in dataSources" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    </label>

    <template v-if="source === 'synthetic'">
      <label class="debug-control">
        <span class="debug-label">набор</span>
        <select v-model="kind">
          <option v-for="item in seriesKinds" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>

      <label class="debug-control" v-if="!hideCount">
        <span class="debug-label">точек</span>
        <input type="number" min="0" max="5000" step="10" v-model.number="count">
      </label>

      <label class="debug-control">
        <span class="debug-label">сид</span>
        <input type="number" min="1" max="99" v-model.number="seed">
      </label>
    </template>

    <span class="debug-hint">
      в ряду: <span class="debug-value">{{ series.length }}</span>
      <template v-if="gaps > 0">, из них <span class="debug-value">null: {{ gaps }}</span></template>
    </span>

    <span class="debug-hint" v-if="source === 'real'">{{ realStatusText }}</span>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { isErrorStatus, loading } from '@/db'
import { dataSources } from '@/pages/debug/shared/fixtures/types'
import { seriesKinds } from '@/pages/debug/shared/fixtures/syntheticSeries'
import type { SeriesSource } from './useSeriesSource'

const props = defineProps<{
  state: SeriesSource
  hideSource?: boolean
  hideCount?: boolean
}>()

const { source, kind, seed, count, series, gaps, realStatus } = props.state

const realStatusText = computed(() => {
  const status = realStatus.value
  if (status === loading) return 'запрос выполняется…'
  if (isErrorStatus(status)) return `ошибка запроса: ${status.reason}`
  return 'данные из ClickHouse: бои по дням за 90 дней'
})

</script>
