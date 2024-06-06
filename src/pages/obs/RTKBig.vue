<template>
  <RTKBig ref="widget" :battles="battles" :lastSession="lastSession" :totalBattles="totalBattles" :place="place"
    :color="color" v-if="!hasError" />
  <p class="error-text" v-else>Никнейм не найден. Если вы уверены в нём, возможно баг, напишите на почту
    soprachev@mail.ru</p>
</template>


<script setup lang="ts">
import RTKBig from '@/components/obs/RTKBig.vue';
import { useQueryStatParams } from '@/composition/useQueryStatParams';
import { query } from '@/db';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';

const params = useQueryStatParams()
const allow = computed(() => params.value.player != null)
let enabled = true

const place = ref(0)
const best = ref(0)
const id = ref(0)
const hasError = ref(false)
const widget = ref<InstanceType<typeof RTKBig> | null>(null)

const route = useRoute()

const color = computed(() => route.query.color?.toString())

type Battle = {
  dateTime: string;
  tankTag: string;
  xp: string;
}

const battles = shallowRef<Battle[]>([])
const lastBattles = shallowRef<Battle[]>([])
const totalBattles = ref(0)

const lastSession = computed(() => {
  let sessionIndex = 0

  const battles = lastBattles.value

  for (sessionIndex = 1; sessionIndex < battles.length; sessionIndex++) {
    const current = battles[sessionIndex]
    const prev = battles[sessionIndex - 1]

    if (new Date(current.dateTime).getTime() - new Date(prev.dateTime).getTime() > 1000 * 60 * 60 * 2) {
      break
    }
  }

  return battles.slice(0, sessionIndex)
})

async function load() {
  if (!allow.value) return
  if (!enabled) return

  console.log(color.value);


  try {

    const data = await fetch(`https://challenge.tanki.su/api/v1/tournaments/585/player/${id.value}?sortby=rating`)
    const parsed = await data.json()
    place.value = Number.parseInt(parsed.data)

    const limits = `between 10 and 23`

    battles.value = (await query<Battle>(`
      select dateTime, tankTag, personal.xp as xp
      from Event_OnBattleResult
      where playerName = '${params.value.player}'
        and tankLevel = 8
        and battleMode = 'REGULAR'
        and dateTime > '2024-05-29'
        and toHour(subtractSeconds(dateTime, duration)) + 3 ${limits}
      order by xp desc
      limit 15`, { allowCache: false })).data

    lastBattles.value = (await query<Battle>(`
      select dateTime, tankTag, personal.xp as xp
      from Event_OnBattleResult
      where playerName = '${params.value.player}' 
        and tankLevel = 8
        and battleMode = 'REGULAR'
        and dateTime > now() - interval 1 day
        and toHour(subtractSeconds(dateTime, duration)) + 3 ${limits}
      order by dateTime desc`, { allowCache: false })).data

    totalBattles.value = (await query<{ count: number }>(`
      select toUInt32(count(*)) as count
      from Event_OnBattleResult
      where playerName = '${params.value.player}'
        and tankLevel = 8
        and battleMode = 'REGULAR'
        and dateTime > '2024-05-29'
        and toHour(subtractSeconds(dateTime, duration)) + 3 ${limits}`,
      { allowCache: false })).data[0].count + (params.value.player == 'EviL_GrannY' ? 200 : 0)



  } catch (error) {
    console.error(error);
  }

  setTimeout(() => load(), 5000);
}

onMounted(() => {
  const nickname = params.value.player
  if (!nickname) return

  fetch(`https://challenge.tanki.su/api/v1/tournaments/585/autocomplete?search=${nickname}`)
    .then(res => res.json())
    .then(data => {
      try {
        id.value = data.data.search_results[0].spa_id
        load()
      } catch (error) {
        hasError.value = true
      }
    })
})

onUnmounted(() => {
  enabled = false
})

watch(place, (value) => {
  if (best.value == 0) {
    best.value = value
    return
  }

  if (value < best.value) {
    best.value = value
    widget.value?.showRecordScreen()
  }
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