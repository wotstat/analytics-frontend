<template>
  <div class="tank-scroll">
    test
    <div class="tank-list">
      <div class="card" v-for="item in tanks.data">
        {{ item.shortNameRU }}
        <img :src="item.iconUrl">
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { queryComputed } from '@/db';

const stats = useQueryStatParams();

const tanks = queryComputed<{ tag: string, battleCount: string, shotsCount: string, shortNameRU: string, nameRU: string, iconUrl: string }>(() => `
select shots.tankTag as tag, battleCount, shotsCount, shortNameRU, nameRU, iconUrl
from (select tankTag, count() as shotsCount from Event_OnShot ${whereClause(stats)} group by tankTag) as shots
         join (select tankTag, count() as battleCount from Event_OnBattleStart ${whereClause(stats)} group by tankTag) as battles on shots.tankTag = battles.tankTag
         join TankList on shots.tankTag = TankList.tag
order by battleCount desc
limit 10;
`);

</script>

<style lang="scss" scoped>
.tank-scroll {
  overflow-y: none;
  overflow-x: auto;

  width: 100%;

  .tank-list {
    display: flex;
  }
}
</style>