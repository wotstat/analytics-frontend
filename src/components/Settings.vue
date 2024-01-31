<template>
  <Teleport to="body">
    <div class="settings">
      <div class="card flex ver">
        <h2>Параметры</h2>

        <div class="scroll">

          <h4>Игрок</h4>
          <input type="text" placeholder="Никнейм" v-model="nickname">

          <h4>Уровень</h4>
          <div class="flex hor variant-selector">
            <div v-for="item in ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const)" class="clickable-variant"
              @click="clickLevel(item)" :class="selectedLevels.includes(item) ? 'selected' : ''">{{ item }}
            </div>
          </div>

          <h4>Класс</h4>
          <div class="flex hor variant-selector">
            <div v-for="item in ([['ЛТ', 'LT'], ['СТ', 'MT'], ['ТТ', 'HT'], ['ПТ', 'AT'], ['САУ', 'SPG']] as const)"
              class="clickable-variant" :class="selectedClasses.includes(item[1]) ? 'selected' : ''"
              @click="clickClass(item[1])">{{
                item[0] }}</div>
          </div>


          <h4>Танк</h4>
          <div class="tank-selector flex ver gap-0">
            <input type="text" placeholder="Поиск" v-model="serachText">
            <div class="tank-list">
              <div class="tank" v-for="tank in sortedTanks"
                :class="selectedTanks.map(t => t.tag).includes(tank.tag) ? 'selected' : ''" @click="clickTank(tank)"> {{
                  tank.name
                }}</div>
            </div>
          </div>


          <h4>Период</h4>
          <select v-model="periodVariant">
            <option value="allTime">За всё время</option>
            <option value="lastX">X последних боёв</option>
            <option value="fromTo">Дата от/до</option>
            <option value="fromToNow">От даты до текущего момента</option>
          </select>

          <div class="lastx" v-if="periodVariant == 'lastX'">
            <h5>Последних боёв</h5>
            <input type="number" min="1" max="100000" step="1" v-model.number="lastX">
          </div>

          <div class="from-to" v-else-if="periodVariant == 'fromTo'">
            <h5>От</h5>
            <input type="date" v-model="fromDate">
            <h5>До</h5>
            <input type="date" v-model="toDate">
          </div>

          <div class="lastx" v-else-if="periodVariant == 'fromToNow'">
            <h5>От</h5>
            <input type="date" v-model="fromDate">
          </div>

          <div class="battles"
            v-if="((periodVariant == 'fromTo' && fromDate && toDate) || (periodVariant == 'fromToNow' && fromDate)) && nickname != ''">
            <h5>Точные границы периода по боям</h5>

            <svg width="100%" height="80" ref="moveContainer" class="battle-timeline">
              <g>
                <g v-for="tick in timelineLabels.ticks">
                  <line :x1="tick.x + '%'" y1="5" :x2="tick.x + '%'" y2="35" class="tick" />
                  <text v-if="tick.labels && tick.x > 10 && tick.x < 90" :x="tick.x + '%'" y="55" text-anchor="middle"
                    class="date">{{
                      tick.labels }}</text>
                </g>
              </g>

              <g>
                <text x="0" y="55" class="date">{{ shortDate(timeLineStart) }}</text>
                <text x="100%" y="55" text-anchor="end" class="date">{{ shortDate(timeLineEnd) }}</text>
              </g>

              <g>
                <rect v-for="battle in playerBattles" :x="100 * battle.start + '%'" class="battle"
                  :width="Math.max(0.1, 100 * (battle.end - battle.start)) + '%'" y="8" height="24" />
              </g>

              <path :d="`M ${leftXPotision * boundingWidth} 5 m 11 0 l -10 0 l 0 30 l 10 0`" stroke-width="2" fill="none"
                class="move" ref="left" />

              <path v-if="periodVariant == 'fromTo'"
                :d="`M ${rightXPotision * boundingWidth} 5 m -11 0 l 10 0 l 0 30 l -10 0`" stroke-width="2" fill="none"
                class="move" ref="right" />
            </svg>
          </div>
        </div>
        <button>Применить</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { dateToDbIndex, query, queryAsync } from '@/db';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch, watchEffect } from 'vue';
import { useDebounce, useDraggable, useElementBounding } from '@vueuse/core';

type TankType = 'LT' | 'MT' | 'HT' | 'AT' | 'SPG';
type TankLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Tank = {
  level: TankLevel,
  type: TankType,
  tag: string,
  name: string,
}
type Battle = {
  start: number,
  end: number,
}

const leftXPotision = ref(0);
const rightXPotision = ref(1);

const moveContainer = ref<SVGElement | null>(null);
const { left: boundingLeft, right: boundingRight, width: boundingWidth } = useElementBounding(moveContainer);
const left = ref<SVGPathElement | null>(null);
const right = ref<SVGPathElement | null>(null);

useDraggable(left, {
  axis: 'x',
  onMove: (e) => leftXPotision.value = Math.min(boundingWidth.value - 20, Math.max(0, e.x - boundingLeft.value)) / boundingWidth.value
});

useDraggable(right, {
  axis: 'x',
  onMove: (e) => rightXPotision.value = Math.min(boundingWidth.value, Math.max(20, 12 + e.x - boundingLeft.value)) / boundingWidth.value
});

const nickname = ref('St0rmHeart')
const periodVariant = ref<'allTime' | 'lastX' | 'fromTo' | 'fromToNow'>('fromToNow')
const selectedClasses = ref<(TankType)[]>([])
const selectedLevels = ref<(TankLevel)[]>([])
const selectedTanks = ref<(Tank)[]>([])
const playerBattles = shallowRef<Battle[]>([])
const fromDate = shallowRef<string | null>(null)
const toDate = shallowRef<string | null>(null)

const debouncedNickname = useDebounce(nickname, 500);

const serachText = ref('');

function clickClass(params: TankType) {
  if (selectedClasses.value.includes(params)) {
    selectedClasses.value = selectedClasses.value.filter((i) => i != params);
  } else {
    selectedClasses.value.push(params);
  }
}

function clickLevel(params: TankLevel) {
  if (selectedLevels.value.includes(params)) {
    selectedLevels.value = selectedLevels.value.filter((i) => i != params);
  } else {
    selectedLevels.value.push(params);
  }
}

function clickTank(tank: Tank) {
  if (selectedTanks.value.map(t => t.tag).includes(tank.tag)) {
    selectedTanks.value = selectedTanks.value.filter((i) => i.tag != tank.tag);
  } else {
    selectedTanks.value.push(tank);
  }
}

const lastX = ref(10);
watch(lastX, (val) => {
  if (val < 0) {
    lastX.value = 1;
  }
});

watch(nickname, val => {
  playerBattles.value = [];
})


const timeLineStart = shallowRef(new Date());
const timeLineEnd = shallowRef(new Date());

const timelineLabels = computed(() => {
  const start = timeLineStart.value;
  const end = timeLineEnd.value;

  const startT = start.getTime();
  const endT = end.getTime();

  if (startT == endT) {
    return {
      ticks: []
    }
  }

  const remapPercent = (val: Date) => (val.getTime() - startT) / (endT - startT) * 100;

  const deltaInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

  let ticks = []
  if (deltaInMonths < 1) {
    for (var day = new Date(startT); day <= end; day.setDate(day.getDate() + 1)) {
      ticks.push({ x: remapPercent(day) });
    }
  } else {
    const startMonth = new Date(startT);
    startMonth.setDate(1);

    for (var month = startMonth; month <= end; month.setMonth(month.getMonth() + 1)) {
      if (deltaInMonths < 12) {
        ticks.push({ x: remapPercent(month), labels: shortDate(month) });
      } else {
        ticks.push({ x: remapPercent(month) });
      }
    }
  }

  return {
    ticks,
  };

})

function shortDate(date: Date) {
  return date.toLocaleString(undefined, {
    month: "numeric", day: "numeric",
  })
}

watch(() => [debouncedNickname.value, fromDate.value, toDate.value] as const, async (val) => {
  if (val[0] == '') {
    playerBattles.value = [];
    return;
  }

  playerBattles.value = [];

  const from = val[1] ? new Date(val[1]) : null
  const to = val[2] ? new Date(val[2]) : new Date()

  if (from) timeLineStart.value = new Date(from.getTime());
  if (to) timeLineEnd.value = new Date(to.getTime());

  const { data: battles } = await query<{ duration: number, dateTime: any }>(`
  select duration, dateTime 
  from Event_OnBattleResult 
  where playerName = '${val[0]}'
  ${from ? `and id >= '${dateToDbIndex(from)}'` : ''}
  ${to ? `and id <= '${dateToDbIndex(to)}'` : ''}
  order by dateTime
  limit 400;
  `);

  const processed = battles.map(t => {
    const end = new Date(t.dateTime);
    const start = new Date(end.getTime() - t.duration * 1000);
    return {
      start: start.getTime(),
      end: end.getTime(),
    }
  })

  if (processed.length == 0) {
    playerBattles.value = [];
    return;
  }

  const min = from ? from.getTime() : processed[0].start;
  const max = to ? to.getTime() : processed[processed.length - 1].end;

  timeLineStart.value = new Date(min);
  timeLineEnd.value = new Date(max);


  playerBattles.value = processed.map(t => ({
    start: (t.start - min) / (max - min),
    end: (t.end - min) / (max - min)
  }));
})


const tanks = queryAsync<{ tankTag: string, tankType: TankType, tankLevel: TankLevel }>(`select distinct tankTag, tankType, tankLevel from Event_OnBattleStart;`)
const tanksProcessed = computed(() => tanks.value.map(t => {
  return {
    level: t.tankLevel,
    type: t.tankType,
    tag: t.tankTag,
    name: t.tankTag.split('_').slice(1).join('_'),
  }
}))

const sortedTanks = computed<Tank[]>(() =>
  tanksProcessed.value
    .filter(t => selectedClasses.value.length == 0 || selectedClasses.value.includes(t.type))
    .filter(t => selectedLevels.value.length == 0 || selectedLevels.value.includes(t.level))
    .filter(t => serachText.value == '' || t.name.toLowerCase().includes(serachText.value.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
)

onMounted(() => {
  document.body.classList.add('no-scroll');
});

onUnmounted(() => {
  document.body.classList.remove('no-scroll');
});

</script>

<style>
.no-scroll {
  overflow: hidden;
}
</style>

<style lang="scss" scoped>
@import "@/styles/mixins.scss";

.battle-timeline {
  .move {
    stroke: #fffbe7;
    filter: drop-shadow(0 0 2px #d66d08);

    &:hover {
      cursor: ew-resize;
    }
  }

  .tick {
    stroke: #dbdbdb3e;
    stroke-width: 1px;
  }

  .date {
    fill: #dbdbdb3e;
    font-size: 12px;
    font-weight: 500;
    user-select: none;
  }

  .battle {
    fill: #e7ffde;
    filter: drop-shadow(0 0 2px #639e31);
  }
}

.settings {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  pointer-events: all;

  background-color: rgba(0, 0, 0, 0.5);

  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  input {
    border: none;
    border-bottom: solid 1px #8181813e;
    padding: 5px;
    border-radius: 5px;
  }

  .variant-selector {
    gap: 10px;
    margin: 2px 0;
    flex-wrap: wrap;
  }

  .clickable-variant {
    cursor: pointer;
    background-color: #8181813e;
    border-radius: 5px;
    min-width: 35px;
    min-height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;

    &.selected {
      color: #353535;
      font-weight: 500;
      background-color: #fffbe7;
      filter: drop-shadow(0 0 0.3em #d66d08);
    }
  }

  .tank-selector {
    border: solid 1px #8181813e;
    border-radius: 5px;

    input {
      border: none;
      border-bottom: solid 1px #8181813e;
      padding: 5px;
      border-radius: 5px;
      margin: 4px 4px;
    }

    .tank-list {
      overflow-y: auto;
      overflow-x: visible;
      height: 200px;

      .tank {
        cursor: pointer;
        padding: 5px;
        border-radius: 5px;
        margin: 2px 4px;
        user-select: none;

        &.selected {
          color: #353535;
          font-weight: 500;
          background-color: #fffbe7;
          filter: drop-shadow(0 0 2px #d66d08);
        }
      }
    }
  }

  .card {
    margin: 40px;
    padding: 20px;
    overflow-y: auto;

    @include medium {
      width: 700px;
    }

    .scroll {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 20px;
      margin: 0 -20px;
    }

    h4,
    h5 {
      margin-bottom: 0;
    }

    h2 {
      margin: 0;
    }
  }
}
</style>