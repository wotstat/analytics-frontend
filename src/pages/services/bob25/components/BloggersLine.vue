<template>
  <div class="line">
    <div class="header">
      <div class="chart-icon" :class="{ 'active': showChart }" @click="showChart = !showChart"
        v-if="showChart !== undefined">
        <Chart />
      </div>
      <h3 v-if="title">{{ title }}</h3>
    </div>
    <div class="card multi-value mono-num">
      <div class="flex">
        <BloggersValues :values="values" space colorize :processor :lessIsBetter />
      </div>
      <div class="flex subline" v-if="withPercent">
        <BloggersValues :values="percents" colorize :processor="t => `${t.toFixed(2)}%`" :lessIsBetter />
      </div>
      <div class="flex subline custom-subline" v-if="slot.subline">
        <slot name="subline" v-for="(item, i) in values" :item :i :processor></slot>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, useSlots } from 'vue'
import BloggersValues from './BloggersValues.vue'
import Chart from '../assets/chart.svg'
import { createLogProcessor } from '@/shared/processors/processors'
import { preferredLogProcessor } from '../store'
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{
  values: number[]
  withPercent?: boolean
  title?: string
  processor?: (value: number) => string
  lessIsBetter?: boolean
  collapseToLog?: boolean
}>()
const slot = useSlots()

const logProc = createLogProcessor()
const mobile = useMediaQuery('(max-width: 800px)')


const processor = computed(() => {
  if (props.processor) return props.processor
  if (mobile.value) return logProc
  return preferredLogProcessor.value ? logProc : undefined
})

const percents = computed(() => props.values.map(v => 100 * v / props.values.reduce((a, v) => a + Math.abs(v), 0.0000001)))

const showChart = defineModel('showChart')

</script>


<style lang="scss" scoped>
.header {
  display: flex;
  margin-bottom: 5px;
  gap: 10px;
  align-items: center;

  h3 {
    flex: 1;
    margin: 0;
  }

  .chart-icon {
    border-radius: 15px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: rgba(102, 102, 102, 0.2);
    user-select: none;

    svg {
      width: 15px;
      height: 15px;
    }

    &.active {
      background: var(--blue-color);
      fill: white;
    }
  }
}

.multi-value {
  font-size: 1.5rem;
  color: white;
  font-size: 28px;
  text-align: center;
  font-weight: bold;
  line-height: 1;

  .subline {
    margin-top: 8px;
    font-size: 15px;
    opacity: 0.8;
  }

  .custom-subline {
    opacity: 1;
  }

  @media screen and (max-width: 900px) {
    font-size: 25px;
  }

  @media screen and (max-width: 800px) {
    font-size: 18px;

    .subline {
      font-size: 13px;
    }
  }

  @media screen and (max-width: 500px) {
    font-size: 16px;

    .subline {
      font-size: 11px;
    }
  }

  :deep(p) {
    flex: 1;
  }
}
</style>