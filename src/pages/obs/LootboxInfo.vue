<template>
  <LootboxInfo ref="widget" v-bind="targetProps" :color="color" :backgroundColor="backgroundColor" v-if="!hasError" />
  <p class="error-text" v-else>Никнейм не найден. Если вы уверены в нём, возможно баг, напишите на почту
    soprachev@mail.ru</p>
  <!-- {{ targetProps }} -->
</template>


<script setup lang="ts">
import LootboxInfo from '@/components/obs/LootboxInfo.vue';
import { useQueryStatParams } from '@/composition/useQueryStatParams';
import { dateToDbIndex, query } from '@/db';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

let enabled = true

const params = useQueryStatParams()
const hasError = ref(false)

const route = useRoute()

const color = computed(() => route.query.color?.toString())
const backgroundColor = computed(() => route.query.backgroundcolor?.toString())
const containerTag = computed(() => route.query.containertag?.toString())

function whereClause(ignore: ('player' | 'tag' | 'date')[] = []) {
  const result = []

  if (containerTag.value && containerTag.value != 'any' && !ignore.includes('tag')) {
    result.push(`containerTag = '${containerTag.value}'`)
  }

  if (params.value.player && !ignore.includes('player')) {
    result.push(`playerName = '${params.value.player}'`)
  }

  const valueParams = params.value

  if (valueParams.period !== 'allTime' && !ignore.includes('date')) {
    if (valueParams.period.type == 'fromTo') {
      result.push(`id >= ${dateToDbIndex(valueParams.period.from)}`);
      result.push(`id <= ${dateToDbIndex(valueParams.period.to)}`);
    } else if (valueParams.period.type == 'fromToNow') {
      result.push(`id >= ${dateToDbIndex(valueParams.period.from)}`);
    }
  }

  return result.join(' and ') || 'true'
}

const targetProps = shallowRef<{
  count: number
  gold: number
  credits: number
  freeXp: number
  premium: number
  tanks: { name: string, count: number }[]
}>({
  count: 0,
  gold: 0,
  premium: 0,
  credits: 0,
  freeXp: 0,
  tanks: []
})

async function load() {
  if (!enabled) return

  try {
    const total = await query<{ prem: number, count: number, credits: number, freeXP: number, gold: number, vehicles: number }>(`
      select
          toUInt32(sum(premiumPlus)) as prem,
          toUInt32(sum(credits)) as credits,
          toUInt32(sum(freeXP)) as freeXP,
          toUInt32(sum(gold) + sum(arraySum(compensatedVehicles.gold))) as gold,
          sum(length(addedVehicles)) as vehicles,
          toUInt32(count()) as count
      from Event_OnLootboxOpen
      where ${whereClause()}
      `, { allowCache: false })

    const tanks = await query<{ tag: string, count: number }>(`
      select tag, toUInt32(count()) as count
      from Event_OnLootboxOpen
              array join arrayConcat(addedVehicles, compensatedVehicles.tag) as tag
      where ${whereClause()}
      group by tag;`
    )

    targetProps.value = {
      premium: total.data[0].prem,
      count: total.data[0].count,
      gold: total.data[0].gold,
      credits: total.data[0].credits,
      freeXp: total.data[0].freeXP,
      tanks: tanks.data.map(t => ({ name: t.tag, count: t.count }))
    }

  } catch (error) {
    console.error(error);
  }

  setTimeout(() => load(), 5000);
}

onMounted(() => {
  load()
})

onUnmounted(() => {
  enabled = false
})



</script>


<style lang="scss" scoped>
.error-text {
  background-color: #6e303086;
  color: white;
  border-radius: 20px;
  padding: 1em;
  font-size: 24px;
  font-weight: bold;
}
</style>