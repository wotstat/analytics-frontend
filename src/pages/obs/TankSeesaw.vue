<template>
  <TankSeesaw v-bind="targetP" :background-color />
</template>


<script setup lang="ts">
import TankSeesaw from '@/components/obs/TankSeesaw.vue';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { query } from '@/db';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const params = useQueryStatParams()
const allow = computed(() => params.value.player != null)
let enabled = true


const route = useRoute()
const backgroundColor = computed(() => route.query.backgroundColor?.toString())
const spacer = computed(() => route.query.spacer ? Number.parseFloat(route.query.spacer.toString()) : undefined)

type Result = {
  nickname: string,
  tank: string,
  admg: number
}
const data = ref<Result[]>([])

async function load() {
  if (!allow.value) return
  if (!enabled) return

  try {
    const res = await query<Result>(`
with '${params.value.player}' as PLAYER_NAME,
 LAST_BATTLE_SQUAD as (select arrayFilter(t -> t.2 = personal.squadID and t.2 != 0, arrayZip(playersResults.name, playersResults.squadID, playersResults.tankTag)) as t
    from Event_OnBattleResult
    where playerName = PLAYER_NAME and dateTime >= '2024-06-02'
    order by dateTime desc
    limit 1 union all (select [] as t)),
    (select * from LAST_BATTLE_SQUAD order by length(t) desc limit 1)  as LAST_BATTLE_SQUAD_FIXED,
arrayFilter(t -> t.2 = personal.squadID and t.2 != 0, arrayZip(playersResults.name, playersResults.squadID, playersResults.tankTag, playersResults.damageDealt)) as filter
select name as nickname, tanks as tank, avg(dmg) as admg, count()
from Event_OnBattleResult
array join filter.1 as name, filter.3 as tanks, filter.4 as dmg
${whereClause(params)} and has(LAST_BATTLE_SQUAD_FIXED.1, name) and has(LAST_BATTLE_SQUAD_FIXED.3, tanks)
group by name, tanks;
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
  if (!r || r.length == 0) return {
    nickname: ['Игрок1', 'Игрок2'],
    tank: ['germany:G89_Leopard1', 'france:F10_AMX_50B'],
    dmg: [[0, 0], [0, 0]]
  }

  const nickNames = [...new Set(r.map(t => t.nickname))].sort((a, b) => a.localeCompare(b))
  const tanks = [...new Set(r.map(t => t.tank))].sort((a, b) => a.localeCompare(b))

  // console.log(nickNames, tanks);

  const dmg = r.reduce((acc, t) => {
    const i = nickNames.indexOf(t.nickname)
    const j = tanks.indexOf(t.tank)
    acc[i][j] = t.admg
    return acc
  }, new Array(nickNames.length).fill(0).map(() => new Array(tanks.length).fill(0)))

  // console.log(dmg);

  return {
    nickname: nickNames,
    tank: tanks,
    dmg: dmg
  }
})

</script>


<style lang="scss" scoped></style>