<template>
  <Transition name="fade">
    <section class="vehicle-statistics" v-if="displayed.length > 0">
      <div class="header">
        <h3>Статистика карт<Transition name="fade-day"><span v-if="displayedDay">, день {{ displayedDay }}</span>
          </Transition>
        </h3>
        <button class="more" @click="showMore = !showMore" v-if="props.mapsStats.length > SHOW_MORE_THRESHOLD">
          {{ showMore ? 'Меньше' : 'Больше' }}
        </button>
      </div>
      <hr class="separator">

      <div class="table-container nice-scrollbar">
        <table>
          <thead>
            <tr>
              <th>
                <Icon :icon="'arena'" />
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
            <tr v-for="arena in displayed" :key="arena.tag">
              <th class="vehicle">
                <TooltipedMinimap :tag="arena.tag" class="image" />
                <p>{{ getArenaName(arena.tag) }}</p>
              </th>
              <td>{{ arena.battles }}</td>
              <td>{{ roundProcessor(arena.winrate * 100, 2) }}%</td>
              <td>{{ roundProcessor(arena.damage) }}</td>
              <td>{{ roundProcessor(arena.assist) }}</td>
              <td>{{ roundProcessor(arena.prestigePoints) }}</td>
              <td>{{ roundProcessor(arena.kills, 2) }}</td>

            </tr>
          </tbody>
        </table>
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


const SHOW_MORE_THRESHOLD = 6

const props = defineProps<{
  mapsStats: ReturnType<typeof useMapsTable>['value']
  displayedDay: number | null
}>()

const showMore = ref(false)

const displayed = computed(() => {
  if (props.mapsStats.length > SHOW_MORE_THRESHOLD && !showMore.value) {
    return props.mapsStats.sort((a, b) => b.battles - a.battles).slice(0, SHOW_MORE_THRESHOLD - 2)
  }

  return props.mapsStats.sort((a, b) => b.battles - a.battles)
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