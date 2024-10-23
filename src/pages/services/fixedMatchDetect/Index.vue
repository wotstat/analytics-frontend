<template>
  <div class="center-container">
    <h1>Вычисление подставных</h1>
    <div class="flex ver">
      <div class="flex">
        <p>Password: </p>
        <input type="password" v-model="password">
      </div>
      <button @click="load" v-if="!loading">Compute</button>
      <p v-else>Loading: {{ current }}/{{ total }} el: {{ lastTime }}s</p>
    </div>

    <div class="drop-zone" @click="openSelectFileDialog" :class="{ 'isOverDropZone': isOverDropZone }"
      ref="dropZoneRef">
      <p>Drop computed file here</p>
    </div>

    <div class="flex ver">
      <div class="flex">
        <h2>Подозрительные</h2>
        <button @click="save">Save</button>
        <button @click="reset">Reset</button>
      </div>
      <div class="card" v-for="item in suspicious">
        <h3><span>{{ item.order }}.</span> {{ item.name }} ({{ item.score }}) Боёв: {{ item.battles }}</h3>
        <div class="friends">
          <div class="friend" v-for="friend in item.friends">
            <div class="arenas">
              <h4><span>{{ friend.arenas.length }}</span> {{ friend.name }}</h4>
              <div class="arena" :class="{ 'selected': hovered == arena.id }" v-for="arena in friend.arenas"
                @pointerover="hover(arena.id)" @pointerout="unhover(arena.id)">
                {{ arena.date.replace('2024-', '').replace(/:[0-9]*\.[0-9]*/, '') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import { createClient } from '@clickhouse/client-web';
import { useDropZone, useLocalStorage } from '@vueuse/core';
// import data from './bb.json';

const data = {}

const dropZoneRef = ref<HTMLDivElement>()
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ['application/json'],
})

function onDrop(files: File[] | null) {
  if (!files) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const text = e.target?.result as string
    const json = JSON.parse(text)
    suspicious.value = json
    console.log(json);

  }
  reader.readAsText(files[0])
}

const password = useLocalStorage('default-password', 'default')
const current = ref(0)
const total = ref(0)
const loading = ref(false)
const hovered = ref<string | null>(null)
const lastTime = ref(0)

const suspicious = useLocalStorage<{
  name: string,
  wotId: number,
  order: number,
  battles: number,
  score: number,
  friends: {
    name: string, wotId: number, arenas: {
      id: string,
      date: string,
    }[]
  }[]
}[]>('suspicious', [])

function hover(id: string) {
  hovered.value = id
}

function unhover(id: string) {
  if (hovered.value === id) hovered.value = null
}

function save() {
  const blob = new Blob([JSON.stringify(suspicious.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'suspicious.json';
  a.click();
  URL.revokeObjectURL(url);
}

function reset() {
  suspicious.value = []
}

function openSelectFileDialog() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files;
    onDrop([...files?.length ? files : []]);
  }
  input.click();
}


async function load() {

  // const data = {}
  const acc = (data as any).data.accounts as any[]
  const longSession = acc.filter(t => t.battles.length > 25)
  const sorted = longSession.sort((a, b) => b.results.totalScores - a.results.totalScores)
  const mapped = sorted.map(t => ({
    name: t.name,
    wotId: t.wotId,
    totalScores: t.results.totalScores
  }))

  loading.value = true
  total.value = mapped.length

  const clickhouse = createClient({
    url: import.meta.env.VITE_CLICKHOUSE_URL,
    username: 'default',
    password: password.value,
    database: 'WOT',
  });


  for (let i = 0; i < mapped.length; i++) {
    const item = mapped[i];
    current.value = i + 1
    console.log(item.name, item.wotId, item.totalScores)

    try {

      //     const result = clickhouse.query({
      //       query: `
      //   with ${item.wotId} as WOT_ID
      //   select
      //       player, toUInt32(count()) as count, arrayZip(groupArray(arenaId), groupArray(time)) as arenas
      //   from
      //   (
      //       with
      //           toHour(dateTime) + 3 as hour,
      //           hour between 9 and 24 or hour between 0 and 1 as prime,
      //           arrayFirstIndex(t -> t = WOT_ID, playersResults.bdid) as targetIndex,
      //           playersResults.tankType[targetIndex] as targetTankType,
      //           playersResults.tankLevel[targetIndex] as targetTankLevel,
      //           playersResults.squadID[targetIndex] as targetSquad
      //       select arenaId, any(dateTime + interval 3 hour) as time, arrayZip(any(playersResults.bdid), any(playersResults.name)) as players
      //       from Event_OnBattleResult
      //       where dateTime between '2024-08-23' and '2024-09-06'
      //           and has(playersResults.bdid, WOT_ID)
      //           and prime
      //           and targetTankType = 'HT'
      //           and targetTankLevel = 10
      //           and targetSquad = 0
      //           and battleMode = 'REGULAR'
      //       group by arenaId
      //   )
      //   array join players as player
      //   group by player
      //   having count() > 3
      //   order by count() desc;
      // `});


      // squad
      const result = clickhouse.query({
        query: `
    with ${item.wotId} as WOT_ID
    select
        player, toUInt32(count()) as count, arrayZip(groupArray(arenaId), groupArray(time)) as arenas
    from
    (
      with
          toHour(dateTime) + 3 as hour,
          hour between 9 and 24 or hour between 0 and 1 as prime,
          arrayFirstIndex(t -> t = WOT_ID, playersResults.bdid) as targetIndex,
          playersResults.tankType[targetIndex] as targetTankType,
          playersResults.tankLevel[targetIndex] as targetTankLevel,
          playersResults.squadID[targetIndex] as targetSquad
      select arenaId, any(dateTime + interval 3 hour) as time,
        arrayFilter(t -> t.3 = targetSquad,
        arrayZip(any(playersResults.bdid), any(playersResults.name), any(playersResults.squadID))) as squadman,
        arrayZip(squadman.1, squadman.2) as players
      from Event_OnBattleResult
      where dateTime between '2024-08-23' and '2024-09-06'
          and has(playersResults.bdid, WOT_ID)
          and prime
          and targetTankType = 'HT'
          and targetTankLevel = 10
          and targetSquad != 0
          and battleMode = 'REGULAR'
      group by arenaId, targetSquad
    )
    array join players as player
    group by player
order by count() desc;
  `});




      const res = await result
      const { data, statistics } = await res.json() as {
        data: {
          count: number,
          player: [string, string],
          arenas: [string, string][]
        }[],
        statistics: {
          elapsed: number
        }
      }

      lastTime.value = statistics.elapsed
      if (data.filter(t => t.player[0] !== item.wotId).length <= 2) continue

      suspicious.value.push({
        name: item.name,
        wotId: item.wotId,
        order: current.value,
        battles: data.find(t => t.player[0] == item.wotId)?.count || 0,
        score: item.totalScores,
        friends: data.map(t => ({
          name: t.player[1],
          wotId: parseInt(t.player[0]),
          arenas: t.arenas.map(([id, date]) => ({ id, date })).sort((a, b) => a.date.localeCompare(b.date))
        })).filter(t => t.wotId !== item.wotId)
      })

    } catch (error) {
      console.error(error)
      i -= 1
    }


  }

  clickhouse.close()
  loading.value = false
}


</script>


<style lang="scss" scoped>
.center-container {

  .drop-zone {
    border: 2px dashed #c48aff39;
    border-radius: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2em 0;
    text-align: center;
    cursor: pointer;
    height: 100px;

    &.isOverDropZone {
      border-color: #c48aff;
    }
  }

  h2 {
    margin: 0;
  }

  .card {
    h3 {
      margin: 0;
      font-size: 1.2em;
      // font-weight: normal;
    }

    .friend {

      .arenas {
        display: flex;
        flex-wrap: wrap;
        font-size: 0.8em;
        align-items: center;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: normal;
          vertical-align: middle;

          span {
            font-weight: bold;
            color: #c58aff;
          }
        }

        .arena {
          padding: 0.2em 0.5em;
          margin: 0.2em;
          background-color: #1b1b1b;
          color: #9856d9;
          border-radius: 6px;
          cursor: pointer;

          transition: all 0.2s;

          &.selected {
            background-color: #7543a8;
            color: #1b1b1b;
          }
        }
      }
    }
  }
}
</style>
