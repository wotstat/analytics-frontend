<template>
  <Transition name="fade">
    <section class="vehicle-statistics" v-if="data.length > 0">
      <div class="header">
        <h3>Статистика танков<Transition name="fade-day"><span v-if="displayedDay">, день {{ displayedDay }}</span>
          </Transition>
        </h3>
        <button class="more" @click="showMore = !showMore" v-if="props.vehicleStats.length > SHOW_MORE_THRESHOLD">
          {{ showMore ? 'Меньше' : 'Больше' }}
        </button>
      </div>
      <hr class="separator">

      <div class="table-container nice-scrollbar-transparent mt-font">
        <ComposableTable :rows="displayedRows" :columns :sort="sorting.sort.value" @sort="sorting.toggle"
          heading-tooltip-class="comp7-tooltip" :row-key="row => row.key">

          <template #header="{ column: { key: col } }">
            <Icon class="heading-icon" :icon="([
              'tank',
              'battles',
              'winrate',
              'dmg',
              'assist',
              'prestige-points',
              'kill'
            ] as const)[col]" />
          </template>

          <template #cell-0="{ row: { index } }">
            <div class="vehicle">
              <VehicleImage :tag="props.vehicleStats[index].tag" class="image" :size="'preview'" :game />
              <VehicleLevel :level="props.vehicleStats[index].level" />
              <VehicleType
                :type="isVehicleType(props.vehicleStats[index].type) ? props.vehicleStats[index].type : 'any'"
                class="type" />
              <p>{{ getTankName(props.vehicleStats[index].tag, true) }}</p>
            </div>
          </template>

          <template #cell="{ value, column: { key: col } }">
            <template v-if="col == 2">{{ roundProcessor(value as number * 100, 2) }}%</template>
            <template v-else-if="col == 6">{{ roundProcessor(value as number, 2) }}</template>
            <template v-else>{{ roundProcessor(value as number) }}</template>
          </template>

        </ComposableTable>
      </div>
    </section>
  </Transition>
</template>


<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import VehicleLevel from '@/shared/game/vehicles/VehicleLevel.vue'
import { useVehicleTable } from './useVehicleTable'
import { isVehicleType } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import { getTankName } from '@/shared/i18n/i18n'
import { roundProcessor } from '@/shared/utils/processors/processors'
import { computed, ref } from 'vue'
import { GameVendor } from '@/shared/game/wot'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import { useTableSorting, statisticsColumns } from '../../shared/useTableSorting'


const SHOW_MORE_THRESHOLD = 5

const columnLabels = [
  '',
  'Бои',
  'Винрейт',
  'Средний урон',
  'Среднее содействие',
  'Средние очки престижа',
  'Средние уничтожения',
]

const props = defineProps<{
  vehicleStats: ReturnType<typeof useVehicleTable>['value'],
  displayedDay: number | null,
  game: GameVendor
}>()

const showMore = ref(false)

const data = computed(() => props.vehicleStats.map(v => [
  v.tag,
  v.battles,
  v.winrate,
  v.damage,
  v.assist,
  v.prestigePoints,
  v.kills
]))

const displayLimit = computed(() => props.vehicleStats.length > SHOW_MORE_THRESHOLD && !showMore.value ? SHOW_MORE_THRESHOLD - 2 : undefined)


const columns = statisticsColumns(columnLabels)
const sorting = useTableSorting(data, { rowKey: index => props.vehicleStats[index].tag })
const displayedRows = computed(() => sorting.rows.value.slice(0, displayLimit.value))

</script>


<style lang="scss" scoped>
.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 22px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.87);
  }

  .more {
    background: none;
    border: none;
    color: var(--blue-thin-color, #fff);
    padding-right: 0;
    margin-bottom: -10px;
    font-size: 14px;

    &:hover {
      color: var(--blue-thin-color-hover, #fff);
    }

  }
}

hr {
  margin: 5px 0;

  border: none;
  border-bottom: 1px solid var(--color-separator, #54545899);

}

.table-container {
  overflow-x: auto;
  font-size: 14px;
  padding-bottom: 5px;

  :deep(.composable-table-cell:first-child) { padding: 0; }

  .heading-icon { width: 40px; display: block; margin: 0 auto; }


  .vehicle {
    display: flex;
    align-items: center;
    margin-left: 10px;
    font-weight: normal;

    .image {
      flex-shrink: 0;
      height: 50px;
      user-select: none;
      pointer-events: none;
    }

    .type {
      height: 16px;
      margin: 0 3px;
    }

    p {
      font-size: 14px;
      line-height: 16px;
      white-space: nowrap;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s, filter 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  filter: blur(3px);
}

.fade-day-enter-active,
.fade-day-leave-active {
  transition: opacity 0.15s, filter 0.15s;
}

.fade-day-enter-from,
.fade-day-leave-to {
  opacity: 0;
  filter: blur(4px);
}
</style>
