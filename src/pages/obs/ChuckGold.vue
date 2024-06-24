<template>
  <ChuckGold v-bind="targetP" :background-color />
</template>


<script setup lang="ts">
import ChuckGold from '@/components/obs/ChuckGold.vue';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { query } from '@/db';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const params = useQueryStatParams()
const allow = computed(() => params.value.player != null)
let enabled = true


const route = useRoute()
const backgroundColor = computed(() => route.query.backgroundColor?.toString())

type Result = {
  nickname: string,
  frags: number,
  dmg: number,
  battles: number,
  wins: number,
  score: number,
  lastBattleSquad: boolean
}
const data = ref<Result[]>([])

async function load() {
  if (!allow.value) return
  if (!enabled) return

  try {
    const res = await query<Result>(`
with '${params.value.player}' as PLAYER_NAME,
    LAST_BATTLE_SQUAD as (select arrayFilter(t -> t.2 = personal.squadID and t.2 != 0, arrayZip(playersResults.name, playersResults.squadID)).1 as t
    from Event_OnBattleResult
    ${whereClause(params)}
    order by dateTime desc
    limit 1 union all (select [] as t)),
    (select * from LAST_BATTLE_SQUAD order by length(t) desc limit 1)  as LAST_BATTLE_SQUAD_FIXED
select pName as nickname,
       toUInt32(sum(pKills)) as frags,
       toUInt32(sum(pDamageDealt)) as dmg,
       toUInt32(count()) as battles,
       toUInt32(countIf(result = 'win')) as wins,
       toUInt32(dmg + frags * 300 + wins * 1000) as score,
       has(LAST_BATTLE_SQUAD_FIXED, pName) as lastBattleSquad
from Event_OnBattleResult
array join
    playersResults.name as pName,
    playersResults.squadID as pSquadID,
    playersResults.damageDealt as pDamageDealt,
    playersResults.kills as pKills
${whereClause(params)}
  and personal.squadID != 0
  and personal.squadID = pSquadID
group by pName
having pName != PLAYER_NAME
order by lastBattleSquad desc, score desc
limit 12;
  `, { allowCache: false })
    data.value = res.data
  } catch (error) {
    console.error(error);
  }

  setTimeout(() => load(), 3000);
}

onMounted(() => {
  load()
})

onUnmounted(() => {
  enabled = false
})

const targetP = computed(() => {
  const r = data.value
  if (!r) return {
    current: [
      { nickname: 'Игрок 1', battles: 0, wins: 0, dmg: 0, frags: 0, score: 0 },
      { nickname: 'Игрок 2', battles: 0, wins: 0, dmg: 0, frags: 0, score: 0 },
      { nickname: 'Игрок 3', battles: 0, wins: 0, dmg: 0, frags: 0, score: 0 }
    ],
    top: [
      { nickname: 'Игрок 1', score: 0 },
      { nickname: 'Игрок 2', score: 0 },
      { nickname: 'Игрок 3', score: 0 },
      { nickname: 'Игрок 4', score: 0 },
      { nickname: 'Игрок 5', score: 0 },
      { nickname: 'Игрок 6', score: 0 },
      { nickname: 'Игрок 7', score: 0 },
      { nickname: 'Игрок 8', score: 0 },
      { nickname: 'Игрок 9', score: 0 },
      { nickname: 'Игрок 10', score: 0 }
    ]
  }

  const current = r.filter(t => t.lastBattleSquad)
  console.log(current);

  return {
    current: new Array(2).fill(0).map((_, i) => current[i] || { nickname: `Совзводный ${i + 1}`, battles: 0, wins: 0, dmg: 0, frags: 0, score: 0 }),
    top: r.sort((a, b) => b.score - a.score).slice(0, 10)
  }
})

</script>


<style lang="scss" scoped></style>