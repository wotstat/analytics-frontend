<template>

  <h2 class="page-title">Очки Чака</h2>
  <div class="flex ver chuck">
    <p>
      По правилам Чака2023:
    <ul>
      <li>Победа – 3000 очков</li>
      <li>Фраг – 300 очков</li>
      <li>1 урон – 1 очко</li>
    </ul>
    </p>

    <FullScreenCard v-for="part in totalResult">
      <ChuckTable :status="response.status" :part="part" />
      <template v-slot:full>
        <ChuckTable :status="response.status" :part="part" />
      </template>
    </FullScreenCard>
  </div>
</template>

<script lang="ts" setup>
import FullScreenCard from '@/components/FullScreenCard.vue';
import ChuckTable from '@/components/widgets/ChuckTable.vue';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { queryAsync } from '@/db';
import { ChuckResult } from '@/db/schema';
import { computed } from 'vue';



const params = useQueryStatParams()
const response = queryAsync<ChuckResult>(`
with
   groupArray(pname) as name,
   groupArray(ptag) as tag,
   groupArray(pdmg) as dmg,
   groupArray(pkill) as kill,
   groupArray(toUInt32(pdmg + pkill * 300)) as score
select
       id,
       dateTime,
       arena,
       result,
       duration,
       spgCount,
       enemyTeamMaxHealth,
       arraySort(t -> t.1, arrayZip(name, tag, dmg, kill, score)) as players,
       toUInt32(arraySum(players.5) + if(result = 'win', 3000, 0)) as totalScore
from (select arenaTag as arena,
             id,
             dateTime,
             result,
             duration,
             onBattleStartId,
             spgCount,
             enemyTeamMaxHealth,
             personal.squadID as playerSquad,
             playersResults.squadID as squads,
             playerName as playerName,
             playersResults.name as names,
             playersResults.damageDealt as damages,
             playersResults.kills as kills,
             playersResults.tankTag as tankTags
      from Event_OnBattleResult
      ${whereClause(params)}
      order by id desc)
array join squads as psquad,
           names as pname,
           damages as pdmg,
           kills as pkill,
           tankTags as ptag
where psquad = playerSquad and playerSquad != 0 or pname = playerName
group by onBattleStartId, arena, result, duration, id, dateTime, spgCount, enemyTeamMaxHealth
order by id desc
`)

const splittedResult = computed(() => {
  let parts = new Map<string, ChuckResult[]>()

  for (const item of response.value.data) {
    const key = item.players.map(t => t[0]).join(',')
    if (!parts.has(key)) parts.set(key, [])
    parts.get(key)?.push(item)
  }

  return [...parts.entries()]
})

const totalResult = computed(() => {
  return splittedResult.value.map(t => {

    const playerCount = t[1][0].players.length


    const sum = t[1]
      .map(t => t.players)
      .reduce((a, v) => {
        for (let i = 0; i < playerCount; i++) {
          a[i][0] += v[i][2]
          a[i][1] += v[i][3]
          a[i][2] += v[i][4]
        }
        return a
      }, new Array(playerCount).fill(0).map(() => [0, 0, 0]))


    const battleCount = t[1].length


    const avg = sum.map(s => s.map(v => v / battleCount))

    const winrate = t[1].filter(t => t.result == 'win').length / battleCount
    const winScoreSum = t[1].reduce((acc, t) => acc + (t.result == 'win' ? 3000 : 0), 0)
    const winScoreAvg = winScoreSum / battleCount

    const healthSum = t[1].reduce((acc, t) => acc + t.enemyTeamMaxHealth, 0)
    const healthAvg = healthSum / battleCount

    const spgSum = t[1].reduce((acc, t) => acc + t.spgCount, 0)
    const spgAvg = spgSum / battleCount

    const timeSum = t[1].reduce((acc, t) => acc + t.duration, 0)
    const timeAvg = timeSum / battleCount

    const dmgSum = t[1].reduce((acc, t) => acc + t.players.reduce((acc, t) => acc + t[2], 0), 0)
    const dmgAvg = dmgSum / battleCount

    const killSum = t[1].reduce((acc, t) => acc + t.players.reduce((acc, t) => acc + t[3], 0), 0)
    const killAvg = killSum / battleCount

    const scoreSum = t[1].reduce((acc, t) => acc + t.totalScore, 0)
    const scoreAvg = scoreSum / battleCount

    t[1].reverse()

    return {
      lines: t,
      sum,
      avg,
      winrate,
      winScoreSum,
      winScoreAvg,
      healthSum,
      healthAvg,
      spgSum,
      spgAvg,
      timeSum,
      timeAvg,
      dmgSum,
      dmgAvg,
      killSum,
      killAvg,
      scoreSum,
      scoreAvg

    }
  })
})


</script>

<style lang="scss" scoped>
@import '/src/styles/table.scss';

.container {
  overflow-x: auto;
}

ul {
  margin-top: 0;
}

td {
  white-space: nowrap;
}
</style>