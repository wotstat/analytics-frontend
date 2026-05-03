<template>
  <Transition name="fade">
    <section class="vehicle-statistics" v-if="data.length > 0">
      <div class="header">
        <h3>Статистика карт<Transition name="fade-day"><span v-if="displayedDay">, день {{ displayedDay }}</span>
          </Transition>
        </h3>
        <button class="more" @click="showMore = !showMore" v-if="props.mapsStats.length > SHOW_MORE_THRESHOLD">
          {{ showMore ? 'Меньше' : 'Больше' }}
        </button>
      </div>
      <hr class="separator">

      <div class="table-container nice-scrollbar mt-font">
        <SortableTable :data="data" :cols="7" :limit="displayLimit" :is-orderable="i => i !== 0" :default-order-by="1">

          <template #head-cell="{ col }">
            <Icon :icon="([
              'arena',
              'battles',
              'winrate',
              'dmg',
              'assist',
              'prestige-points',
              'kill'
            ] as const)[col]" />
          </template>

          <template #data-cell="{ value, index, col }">
            <th class="minimap" v-if="col === 0">
              <TooltipedMinimap :tag="props.mapsStats[index].tag" class="image" :game />
              <p>{{ getArenaName(props.mapsStats[index].tag) }}</p>
            </th>
            <td v-else-if="col == 2">{{ roundProcessor(value as number * 100, 2) }}%</td>
            <td v-else-if="col == 6">{{ roundProcessor(value as number, 2) }}</td>
            <td v-else>{{ roundProcessor(value as number) }}</td>
          </template>

        </SortableTable>
      </div>
    </section>
  </Transition>
</template>


<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { useMapsTable } from './useMapsTable'
import { getArenaName } from '@/shared/i18n/i18n'
import { roundProcessor } from '@/shared/utils/processors/processors'
import { computed, ref } from 'vue'
import TooltipedMinimap from './TooltipedMinimap.vue'
import { GameVendor } from '@/shared/game/wot'
import SortableTable from '../sortableTable/SortableTable.vue'


const SHOW_MORE_THRESHOLD = 6

const props = defineProps<{
  mapsStats: ReturnType<typeof useMapsTable>['value']
  displayedDay: number | null
  game: GameVendor
}>()

const showMore = ref(false)

const data = computed(() => props.mapsStats.map(v => [
  v.tag,
  v.battles,
  v.winrate,
  v.damage,
  v.assist,
  v.prestigePoints,
  v.kills
]))

const displayLimit = computed(() => props.mapsStats.length > SHOW_MORE_THRESHOLD && !showMore.value ? SHOW_MORE_THRESHOLD - 2 : undefined)

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
    font-size: 14px;
    margin-bottom: -10px;

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

  thead {
    th {

      svg {
        width: 40px;
        display: block;
        margin: 0 auto;
      }

      &:first-child {
        width: 25%;
      }
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

    .type {
      height: 16px;
      margin: 0 3px;
    }

    p {
      font-size: 15px;
      line-height: 16px;
      white-space: nowrap;
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