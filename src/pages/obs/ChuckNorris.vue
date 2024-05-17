<template>
  <ChuckNorris v-bind="targetP" ref="widget" />
</template>


<script setup lang="ts">
import ChuckNorris from '@/components/obs/ChuckNorris.vue';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { query } from '@/db';
import { ChuckResult } from '@/db/schema';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch, watchEffect } from 'vue';

const params = useQueryStatParams()
const allow = computed(() => params.value.player != null)
let enabled = true

type TargetChuckResult = { players: ChuckResult['players'], totalScore: number }
const data = shallowRef<TargetChuckResult[]>([])
const widget = ref<InstanceType<typeof ChuckNorris> | null>(null)

async function load() {
  if (!allow.value) return
  if (!enabled) return

  try {
    const res = await query<TargetChuckResult>(`
with
   groupArray(pname) as name,
   groupArray(ptag) as tag,
   groupArray(pdmg) as dmg,
   groupArray(pkill) as kill,
   groupArray(toUInt32(pdmg + pkill * 300)) as score
select arraySort(t -> t.1, arrayZip(name, tag, dmg, kill, score)) as players,
       toUInt32(arraySum(players.5) + if(result = 'win', 3000, 0)) as totalScore
from (select id,
             result,
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
group by result, id
order by id desc
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

const splittedResult = computed(() => {
  let parts = new Map<string, TargetChuckResult[]>()

  for (const item of data.value) {
    const key = item.players.map(t => t[0]).join(',')
    if (!parts.has(key)) parts.set(key, [])
    parts.get(key)?.push(item)
  }

  return [...parts.entries()]
})

const battles = computed(() => splittedResult.value.length > 0 ? splittedResult.value[0][1] : null)
const prepare = computed(() => {
  if (!battles.value) return null
  const b = battles.value
  const scores = b.map(t => t.players.map(p => p[4]))
  const avg = scores[0].map((_, i) => scores.map(t => t[i]).reduce((a, b) => a + b, 0) / scores.length)
  return {
    avg,
    last: scores[0],
    players: b[0].players.map(t => t[0]),
    total: b.length,
    sum: b.map(t => t.totalScore).reduce((a, b) => a + b, 0),
    sumLast: b[0].totalScore,
    max: Math.max(...b.map(t => t.totalScore))
  }
})

const targetP = computed(() => {
  const r = prepare.value
  if (!r) return {
    players: [
      { nickname: 'Игрок 1', avg: 0, last: 0, },
      { nickname: 'Игрок 2', avg: 0, last: 0, },
      { nickname: 'Игрок 3', avg: 0, last: 0, }
    ],
    sum: {
      avg: 0,
      last: 0,
      max: 0
    },
    battles: 0
  }

  const players = r.avg.map((_, i) => {
    return {
      nickname: r.players[i],
      avg: r.avg[i],
      last: r.last[i]
    }
  })

  return {
    players,
    battles: r.total,
    sum: {
      avg: r.sum / r.total,
      last: r.sumLast,
      max: r.max
    }
  }
})

watch(targetP, (val, old) => {
  if (old.battles < 5) return
  if (val.sum.max == old.sum.max) return

  widget.value?.showRecordScreen(val.sum.max)
})

</script>


<style lang="scss" scoped></style>