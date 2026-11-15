<template>
  <VehicleTableMetaLayout :label="params.region" :heading :labels
    :rows :slots :sort="sorting.sortOrders.value" :state>
    <template v-if="params.deltaPeriod !== 'none'" #detail="{ row, metric }">
      <AchievementDelta class="delta" :value="achievementDelta(row, metric, params.deltaPeriod)" />
    </template>
  </VehicleTableMetaLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RenderContext } from '@/meta/utils'
import { vehicleCatalog } from '@/shared/game/domain/vehicles/catalog'
import VehicleTableMetaLayout from '../../vehicles/meta/table/VehicleTableMetaLayout.vue'
import { selectionLabelParts } from '../../vehicles/meta/utils/selectionLabels'
import { useVehiclesMetaReady } from '../../vehicles/meta/utils/readiness'
import { useAchievementStatistics } from '../utils/useAchievementStatistics'
import { useAchievementTableRows } from '../utils/useAchievementTableRows'
import AchievementDelta from '../AchievementDelta.vue'
import { achievementDelta, type AchievementKind } from '../utils/achievements'
import { readAchievementMetaParams } from './utils/params'

const props = defineProps<{ context: RenderContext, kind: AchievementKind, heading: string }>()
const params = readAchievementMetaParams(props.kind, new URL(props.context.url))
const { statistics } = useAchievementStatistics(props.kind, ref(params.region))
const { rows, slots, sorting } = useAchievementTableRows(props.kind, () => statistics.value.data, ref(params.sort), () => params.filters)
const state = useVehiclesMetaReady(() => [statistics.value.status, vehicleCatalog.value.status])

const labels = selectionLabelParts(params.filters)
if (params.search) labels.push({ text: `Поиск: ${params.search.slice(0, 60)}` })
if (params.deltaPeriod !== 'none') {
  const period = { day: 'день', week: 'неделю', month: 'месяц', quarter: 'три месяца', 'half-year': 'полгода', year: 'год' }
  labels.push({ text: `Прирост за ${period[params.deltaPeriod]}` })
}
</script>

<style scoped lang="scss">
.delta {
  display: block;
  margin-top: 2px;
  font-size: 16px;
}
</style>
