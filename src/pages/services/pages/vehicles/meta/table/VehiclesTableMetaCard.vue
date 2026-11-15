<template>
  <VehicleTableMetaLayout :label="`${regionLabel(params.filters)} · ${periodLabel(params.table.period)}`"
    :heading="tableHeading(params)" :subtitle="modeLabel(params.filters)" :labels :rows :slots :sort :state :background>
    <template v-if="$slots.background" #background><slot name="background" /></template>
  </VehicleTableMetaLayout>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { RenderContext } from '@/meta/utils'
import VehicleTableMetaLayout from './VehicleTableMetaLayout.vue'
import { readVehiclesMetaParams } from '../utils/params'
import { useTableMeta } from './useTableMeta'
import { tableHeading, tableFilterLabels, regionLabel, modeLabel, periodLabel } from '../utils/labels'

const props = defineProps<{ context: RenderContext, background?: Component }>()
const params = readVehiclesMetaParams(new URL(props.context.url))
const { rows, state, slots, sort } = useTableMeta(params, new Date().toISOString().slice(0, 10))
const labels = computed(() => tableFilterLabels(params))
</script>
