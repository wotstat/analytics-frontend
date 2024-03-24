<template>
  <div class="tank-scroll">
    <div class="tank-list">
      <ServerStatusWrapper :status="tanks.status" v-slot="{ status }">

        <template v-if="status == 'loading'">
          <div class="card loading" v-for="item in new Array(6)">
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
        </template>


        <div class="card" v-for="item in tanks.data" @click="e => onClick(e, item.tag)"
          :class="stats.tanks?.includes(item.tag) ? 'selected' : ''">
          <p class="tank-name">{{ item.shortNameRU }}</p>
          <img :src="item.iconUrl">
          <table cellspacing="0" cellpadding="0">
            <tr>
              <th>Боёв</th>
              <td>{{ item.battleCount }}</td>
            </tr>
            <tr>
              <th>Выстрелов</th>
              <td>{{ item.shotsCount }}</td>
            </tr>
          </table>
        </div>
      </ServerStatusWrapper>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { queryComputed } from '@/db';
import { useRoute, useRouter } from 'vue-router';
import ServerStatusWrapper from '../ServerStatusWrapper.vue';


const router = useRouter()
const route = useRoute()

const stats = useQueryStatParams();

const tanks = queryComputed<{ tag: string, battleCount: string, shotsCount: string, shortNameRU: string, iconUrl: string }>(() => `
select battles.tankTag as tag, battleCount, shotsCount, shortNameRU, iconUrl
from (select tankTag, count() as battleCount from Event_OnBattleStart ${whereClause(stats.value, { ignore: ['tanks'], isBattleStart: true })} group by tankTag) as battles 
         left join (select tankTag, count() as shotsCount from Event_OnShot ${whereClause(stats.value, { ignore: ['tanks'] })} group by tankTag) as shots on shots.tankTag = battles.tankTag
         left join TankList on battles.tankTag = TankList.tag
order by battleCount desc
limit 50;
`);


function onClick(e: MouseEvent, tag: string) {
  const currentTanks = stats.value.tanks || [];
  if (currentTanks.includes(tag)) {
    const targetTanks = currentTanks.filter(t => t !== tag);
    const target = { ...route.query, tank: targetTanks.length != 0 ? currentTanks.filter(t => t !== tag).join(',') : undefined };
    router.push({ query: target });
  } else if (e.ctrlKey || e.metaKey) {
    const target = { ...route.query, tank: [...currentTanks, tag].join(',') };
    router.push({ query: target });
  } else {
    router.push({ query: { ...route.query, tank: tag } });
  }
}

</script>

<style lang="scss" scoped>
@import '@/styles/textColors.scss';
@import '@/styles/table.scss';

.skeleton {
  td {
    min-width: 40px;
  }
}

.tank-scroll {
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    // box-shadow: inset 0 0 5px grey;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: $background-secondary;
    box-shadow: 0 1px 2px 0px rgb(0, 0, 0, 0.1);
    border-radius: 10px;
    cursor: pointer;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #464646;
  }

  .tank-list {
    display: flex;
    gap: 10px;
    padding: 10px;

    .card {
      cursor: pointer;
      border: 2px solid transparent;

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

      &.selected {
        // font-weight: 500;
        border: 2px solid #fffbe7;
        // color: #353535;
        // background-color: #fffbe7;
        filter: drop-shadow(0 0 3px #d66d08);
      }

      .tank-name {
        font-weight: bold;
        text-align: center;
        margin-top: -10px;
        margin-bottom: 5px;

        &.skeleton {
          width: 100%;
          height: 22px;
          border-radius: 5px;
          @include text-skeleton(#8181813e, #aaaaaa3e)
        }
      }

      img, .img.skeleton {
        width: 150px;
        aspect-ratio: 16/10;
        margin: 7px 0;
        pointer-events: none;
        user-select: none;

        &.skeleton {
          border-radius: 5px;
          border: none;
          outline: none;
          @include text-skeleton(#8181813e, #aaaaaa3e)
        }
      }
    }
  }
}
</style>