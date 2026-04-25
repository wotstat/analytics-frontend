<template>
  <Transition name="fade">
    <section class="vehicle-statistics" v-if="displayed.length > 0">
      <div class="header">
        <h3>Статистика танков<Transition name="fade-day"><span v-if="displayedDay">, день {{ displayedDay }}</span>
          </Transition>
        </h3>
        <button class="more" @click="showMore = !showMore" v-if="props.vehicleStats.length > SHOW_MORE_THRESHOLD">
          {{ showMore ? 'Меньше' : 'Больше' }}
        </button>
      </div>
      <hr class="separator">

      <div class="table-container nice-scrollbar">
        <table>
          <thead>
            <tr>
              <th>
                <Icon :icon="'tank'" />
              </th>
              <th>
                <Icon :icon="'battles'" />
              </th>
              <th>
                <Icon :icon="'winrate'" />
              </th>
              <th>
                <Icon :icon="'dmg'" />
              </th>
              <th>
                <Icon :icon="'assist'" />
              </th>
              <th>
                <Icon :icon="'prestige-points'" />
              </th>
              <th>
                <Icon :icon="'kill'" />
              </th>
            </tr>
          </thead>

          <tbody class="mt-font">
            <tr v-for="vehicle in displayed" :key="vehicle.tag">
              <th class="vehicle">
                <VehicleImage :tag="vehicle.tag" class="image" :size="'preview'" :game />
                <VehicleLevel :level="vehicle.level" />
                <VehicleType :type="isVehicleType(vehicle.type) ? vehicle.type : 'any'" class="type" />
                <p>{{ getTankName(vehicle.tag) }}</p>
              </th>
              <td>{{ vehicle.battles }}</td>
              <td>{{ roundProcessor(vehicle.winrate * 100, 2) }}%</td>
              <td>{{ roundProcessor(vehicle.damage) }}</td>
              <td>{{ roundProcessor(vehicle.assist) }}</td>
              <td>{{ roundProcessor(vehicle.prestigePoints) }}</td>
              <td>{{ roundProcessor(vehicle.kills, 2) }}</td>

            </tr>
          </tbody>
        </table>
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

const SHOW_MORE_THRESHOLD = 5

const props = defineProps<{
  vehicleStats: ReturnType<typeof useVehicleTable>['value'],
  displayedDay: number | null,
  game: GameVendor
}>()

const showMore = ref(false)

const displayed = computed(() => {
  if (props.vehicleStats.length > SHOW_MORE_THRESHOLD && !showMore.value) {
    return props.vehicleStats.sort((a, b) => b.battles - a.battles).slice(0, SHOW_MORE_THRESHOLD - 2)
  }

  return props.vehicleStats.sort((a, b) => b.battles - a.battles)
})


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
}

table {
  width: 100%;
  border-collapse: collapse;

  thead {
    svg {
      width: 40px;
    }

    tr {

      td:first-child,
      th:first-child {
        width: 25%;
      }
    }
  }

  tbody {
    tr {
      &:nth-child(2n+1) {
        background-color: rgba(248, 252, 255, 0.025);
      }

      .vehicle {
        display: flex;
        align-items: center;
        margin-left: 10px;
        font-weight: normal;

        .image {
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
        }
      }

      td {
        text-align: center;
      }
    }

    td {
      font-size: 14px;
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