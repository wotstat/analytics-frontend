<template>

  <ServerStatusWrapper :status="tanks.status" v-slot="{ status }">
    <HorizontalScrollItems v-if="status != 'loading'" :items="tanks.data.map(t => ({ ...t, key: t.tag }))"
      v-model:selected="selectedTanks" selectable>
      <template #default="{ item }">
        <div class="tank-info">
          <p class="tank-name">{{ getTankName(item.tag, true) }}</p>
          <VehicleImage :tag="item.tag" :size="'preview'" class="img" :loading="'lazy'" />
          <table cellspacing="0" cellpadding="0">
            <tbody>
              <tr>
                <th>Боёв</th>
                <td>{{ logProcessor(item.battleCount) }}</td>
              </tr>
              <tr>
                <th>Выстрелов</th>
                <td>{{ logProcessor(item.shotsCount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </HorizontalScrollItems>

    <HorizontalScrollItems v-else :items="new Array(8).fill(0).map(i => ({ key: `${i}` }))">
      <div class="tank-info loading">
        <p class="tank-name skeleton"></p>
        <div class="img skeleton"></div>
        <table cellspacing="0" cellpadding="0">
          <tbody>
            <tr class="skeleton">
              <th class="ignore-skeleton">Боёв</th>
              <td></td>
            </tr>
            <tr class="skeleton">
              <th class="ignore-skeleton">Выстрелов</th>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </HorizontalScrollItems>
  </ServerStatusWrapper>

</template>

<script lang="ts" setup>
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams'
import { LONG_CACHE_SETTINGS, queryComputed } from '@/db'
import { useRoute, useRouter } from 'vue-router'
import ServerStatusWrapper from '../../pages/infographics/shared/ServerStatusWrapper.vue'
import { computed, ref } from 'vue'
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor'
import { getTankName } from '@/utils/i18n'
import HorizontalScrollItems from '../shared/HorizontalScrollItems.vue'
import { pausableWatch } from '@vueuse/core'
import VehicleImage from '../vehicles/vehicle/VehicleImage.vue'




const router = useRouter()
const route = useRoute()

const stats = useQueryStatParams()

const selectedTanks = ref<string[]>([])

const selectedToStats = pausableWatch(() => selectedTanks.value, (tanks) => {
  statsToSelected.pause()
  const target = { ...route.query, tank: tanks.length != 0 ? tanks.join(',') : undefined }
  router.push({ query: target })
  statsToSelected.resume()
})

const statsToSelected = pausableWatch(() => stats.value.tanks, (tanks) => {
  selectedToStats.pause()
  selectedTanks.value = tanks || []
  selectedToStats.resume()
}, { immediate: true })

const fixedSpaceProcessor = useFixedSpaceProcessor(0)
function logProcessor(value: number) {
  if (value < 1e6) return fixedSpaceProcessor(value)
  if (value < 1e9) return (value / 1e6).toFixed(1) + 'M'
}

const cacheSettings = computed(() => {
  if (stats.value.player) return {}
  return LONG_CACHE_SETTINGS
})

const tanks = queryComputed<{ tag: string, battleCount: number, shotsCount: number }>(() => `
select battles.tankTag as tag,
       battleCount,
       shotsCount,
from (select tankTag, toUInt32(count()) as battleCount from Event_OnBattleStart ${whereClause(stats.value, { ignore: ['tanks'], isBattleStart: true })} group by tankTag) as battles
left join (select tankTag, toUInt32(count()) as shotsCount from Event_OnShot ${whereClause(stats.value, { ignore: ['tanks'] })} group by tankTag) as shots on shots.tankTag = battles.tankTag
order by battleCount desc
limit 150;
`, { settings: cacheSettings.value })

</script>

<style lang="scss" scoped>
@use '/src/styles/textColors.scss' as *;
@use '/src/styles/table.scss' as *;
@use '/src/styles/variables.scss' as *;

.skeleton {
  td {
    min-width: 40px;
  }
}

.tank-info {
  table {
    width: 100%;

    th {
      text-align: left;
      font-weight: 300;
      margin-left: 5px;
      color: #bababa;
    }

    td {
      text-align: right;
    }
  }

  .tank-name {
    font-weight: bold;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: -10px;
    margin-bottom: 5px;
    width: 150px;

    &.skeleton {
      width: 100%;
      height: 25px;
      margin-top: 0;
      border-radius: 5px;
      @include text-skeleton(#8181813e, #aaaaaa3e)
    }
  }


  img,
  .img,
  .img.skeleton {
    width: 150px;
    aspect-ratio: 16/10;
    margin: 7px 0;
    pointer-events: none;
    user-select: none;

    text-align: center;
    line-height: 100%;
    font-size: 3em;
    color: #bababa97;
    font-size: 10px;

    &.flex {
      justify-content: center;
      align-items: center;
    }

    span {
      filter: drop-shadow(0px 4px 6px black);
    }

    &.skeleton {
      border-radius: 5px;
      border: none;
      outline: none;
      @include text-skeleton(#8181813e, #aaaaaa3e)
    }
  }
}
</style>