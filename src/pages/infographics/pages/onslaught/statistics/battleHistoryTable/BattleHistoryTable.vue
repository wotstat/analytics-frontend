<template>
  <Transition name="fade">
    <section class="vehicle-statistics" v-if="data.length > 0">
      <div class="header">
        <h3>История боёв<Transition name="fade-day"><span v-if="displayedDay">, день {{ displayedDay }}</span>
          </Transition>
        </h3>
        <button class="more" @click="onClickShowMore" v-if="props.history.length > SHOW_MORE_THRESHOLD">
          {{ showMore ? 'Меньше' : 'Больше' }}
        </button>
      </div>
      <hr class="separator">

      <div class="table-container nice-scrollbar-transparent mt-font">
        <SortableTable :data="data" :cols="8" :limit="displayLimit" :is-orderable="i => i != 1 && i != 2"
          :default-order-by="0">

          <template #head-cell="{ col }">
            <p v-if="col == 0">№</p>
            <Icon v-else :icon="([
              'tank',
              'arena',
              'tank',
              'dmg',
              'assist',
              'prestige-points',
              'kill',
              'battles',
            ] as const)[col]" />
          </template>

          <template #data-cell="{ value, index, col }">
            <td v-if="col === 0">{{ (value as number) + 1 }}</td>
            <td v-else-if="col === 1">
              <div class="minimap">
                <TooltipedMinimap :tag="props.history[index].arena" class="image" :game
                  :team="props.history[index].team" />
                <p>{{ getArenaName(props.history[index].arena) }}</p>
              </div>
            </td>
            <td v-else-if="col === 2">
              <div class="vehicle">
                <VehicleImage :tag="props.history[index].tankTag" class="image" :size="'preview'" :game />
                <VehicleLevel :level="props.history[index].tankLevel" />
                <VehicleType
                  :type="isVehicleType(props.history[index].tankType) ? props.history[index].tankType : 'any'"
                  class="type" />
                <p>{{ getTankName(props.history[index].tankTag, true) }}</p>
              </div>
            </td>
            <td v-else-if="col === 7">
              <div class="rating" v-if="value">
                <span class='delta green' v-if="(value as number) > 0">+{{ value }}</span>
                <span class='delta red' v-else-if="(value as number) < 0">{{ value }}</span>
              </div>
              <div class="rating-qual" :class="props.history[index].result == 'win' ? 'green' : 'red'" v-else>
                <Icon :icon="'battles'" />
              </div>
            </td>
            <td v-else>{{ roundProcessor(value as number) }}</td>
          </template>

        </SortableTable>
      </div>

      <div class="footer">
        <div class="spacer flex-1"></div>
        <TipShiftKeyForShowMore ref="shiftKeyForShowMoreBubble"
          :display="props.history.length > limit && showMore && maxTouchPoints == 0" />
        <button class="more" @click="increaseLimit" v-if="props.history.length > limit && showMore">
          Загрузить ещё...
        </button>
      </div>
    </section>
  </Transition>
</template>


<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import VehicleLevel from '@/shared/game/vehicles/VehicleLevel.vue'
import { useBattleResultTable } from './useBattleHistory'
import { isVehicleType } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import { getArenaName, getTankName } from '@/shared/i18n/i18n'
import { roundProcessor } from '@/shared/utils/processors/processors'
import { computed, ref, watch } from 'vue'
import { GameVendor } from '@/shared/game/wot'
import SortableTable from '../sortableTable/SortableTable.vue'
import TooltipedMinimap from '../mapsTable/TooltipedMinimap.vue'
import TipShiftKeyForShowMore from '../tips/TipShiftKeyForShowMore.vue'

const SHOW_MORE_THRESHOLD = 7
const START_LIMIT = 20

const props = defineProps<{
  history: ReturnType<typeof useBattleResultTable>['value'],
  displayedDay: number | null,
  game: GameVendor
  nickname: string
}>()

const showMore = ref(false)
const limit = ref(START_LIMIT)
const shiftKeyForShowMoreBubble = ref<InstanceType<typeof TipShiftKeyForShowMore> | null>(null)

const maxTouchPoints = navigator.maxTouchPoints || 0

watch(() => props.nickname, (value, old) => {
  if (value !== old) {
    showMore.value = false
    limit.value = START_LIMIT
  }
})

const data = computed(() => props.history.map((v, i) => [
  i,
  v.arena,
  v.tankTag,
  v.damage,
  v.assist,
  v.prestigePoints,
  v.kills,
  v.ratingDelta
]))

const displayLimit = computed(() => props.history.length > SHOW_MORE_THRESHOLD && !showMore.value ? SHOW_MORE_THRESHOLD - 2 : limit.value)

function onClickShowMore() {
  showMore.value = !showMore.value
  if (!showMore.value) {
    limit.value = START_LIMIT
  }
}

function increaseLimit(e: PointerEvent) {
  if (e.shiftKey) shiftKeyForShowMoreBubble.value?.accept()
  else shiftKeyForShowMoreBubble.value?.wrong()

  limit.value += e.shiftKey ? 100 : 30
}

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
    margin-bottom: -10px;
  }
}

.more {
  background: none;
  border: none;
  color: var(--blue-thin-color, #fff);
  padding-right: 0;
  font-size: 14px;

  &:hover {
    color: var(--blue-thin-color-hover, #fff);
  }
}

.footer {
  gap: 0;
  height: 20px;
  display: flex;
  align-items: center;

  .more {
    margin-left: 5px;
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

  :deep(table) {

    th {
      svg {
        width: 40px;
        display: block;
        margin: 0 auto;
      }
    }

    td,
    th {
      width: 20%;
    }

    td:first-child,
    th:first-child {
      min-width: 50px;
      width: 50px;
    }

    td:nth-child(2),
    th:nth-child(2) {
      min-width: 190px;
      width: 190px;
    }

    td:nth-child(3),
    th:nth-child(3) {
      min-width: 190px;
      width: 190px;
    }
  }


  .minimap {
    display: flex;
    align-items: center;
    margin-left: 10px;
    font-weight: normal;

    .image {
      height: 40px;
      width: 40px;
      user-select: none;
      margin: 5px;
      border-radius: 4px;
      overflow: hidden;
      margin-right: 10px;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.1);
    }

    p {
      font-size: 15px;
      line-height: 16px;
      white-space: nowrap;
    }
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

  .rating {
    font-size: 17px;
    margin-right: 0.3em;

    .delta {
      &.green {
        color: #4aff62;
      }

      &.red {
        color: #ff4e4e;
      }
    }
  }

  .rating-qual {
    display: flex;
    justify-content: center;
    width: 40px;
    margin: 0 auto;

    &.green {
      color: var(--green-color, #4aff62);
    }

    &.red {
      color: var(--red-color, #ff4e4e);
    }
  }

  td {
    text-align: center;
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