<template>
  <div class="container" ref="container">
    <table class="hover-highlight">

      <thead>
        <tr>
          <th colspan="9" class="title">Игроки с которыми вы попадали чаще всего</th>
        </tr>
        <tr>
          <th>Никнейм</th>
          <th>Количество боёв</th>
          <td>Урон как союзник</td>
          <td>Урон как противник</td>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in data">
          <td>
            <a :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.name }}</a>
          </td>
          <td class="text-effect orange"><b>{{ item.count }}</b></td>
          <td class="text-effect green">{{ item.playerDamage?.toFixed(0) ?? '-' }}</td>
          <td class="text-effect red">{{ item.opponentDamage?.toFixed(0) ?? '-' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { StatParams, whereClause } from '@/composition/useQueryStatParams';
import { queryAsync, semverCompareStartFrom } from '@/db';
import { useElementVisibility } from '@vueuse/core';
import { computed, ref } from 'vue';

const { params } = defineProps<{
  params?: StatParams
}>()

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);


const result = queryAsync<{
  name: string,
  bdid: string,
  region: string,
  count: number,
  playerDamage: number,
  opponentDamage: number
}>(`
select *
from (select name,
             bdid,
             region,
             count()                            as count,
             avgIf(damage, team = fPlayerTeam)  as playerDamage,
             avgIf(damage, team != fPlayerTeam) as opponentDamage
      from (select region,
                   any(playerTeam)                 as fPlayerTeam,
                   any(playerName)                 as fPlayerName,
                   any(personal.squadID)           as squadID,
                   any(playersResults.name)        as name,
                   any(playersResults.team)        as team,
                   any(playersResults.damageDealt) as damage,
                   any(playersResults.bdid)        as bdid,
                   any(playersResults.squadID)     as sqid
            from Event_OnBattleResult
              ${semverCompareStartFrom('1.1.0.0')}
              ${params ? whereClause(params, { withWhere: false }) : ''}
            group by arenaId, region)
          array join name, team, damage, bdid, sqid
      where name != fPlayerName and (squadID = 0 or sqid != squadID)
      group by name, bdid, region)
where count > 1
order by count desc
limit 30`, visible)

const data = computed(() => {
  return result.value?.map((item, index) => {
    const prefix = item.region.toLowerCase() === 'ru' ? 'https://tanki.su/ru/community/accounts/' : 'https://worldoftanks.eu/en/community/accounts/';
    return {
      ...item,
      url: `${prefix}${item.bdid}-${item.name}/`,
      index: index + 1
    }
  })

})

</script>


<style lang="scss" scoped>
@import '@/styles/table.scss';

.container {
  overflow-x: auto;
}

a {
  color: inherit;
  font-weight: 400;
  transition: all 0.1s;

  &:hover {
    color: #eff3ff;
    filter: drop-shadow(0 0 0.5em #5249c6);
  }
}

table {
  border-collapse: collapse;
  width: 100%;
  position: relative;
  z-index: 5;

  .title {
    padding: 0 0 15px 0;
  }

  thead {
    border-bottom: $border;
  }

  td {
    text-align: center;
    width: 10%;
    position: relative;
    padding: 0 4px;
    text-wrap: nowrap;
  }

  td:first-child {
    border-right: $border;
  }

  th:first-child:not(.title) {
    border-right: $border;
  }
}
</style>