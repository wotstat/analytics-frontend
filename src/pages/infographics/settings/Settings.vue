<template>
  <Teleport to="body">
    <div class="settings">
      <div class="card flex ver">
        <div class="flex title">
          <h2 class="flex-1">Параметры</h2>
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
            width="15.4859" height="15.4956" class="close" @click="emit('close')">
            <g>
              <rect height="15.4956" opacity="0" width="15.4859" x="0" y="0" />
              <path
                d="M0.252699 15.2429C0.594496 15.575 1.1609 15.575 1.49293 15.2429L7.74293 8.99293L13.9929 15.2429C14.325 15.575 14.9011 15.5847 15.2332 15.2429C15.5652 14.9011 15.5652 14.3445 15.2332 14.0125L8.98317 7.7527L15.2332 1.5027C15.5652 1.17067 15.575 0.604261 15.2332 0.27223C14.8914-0.0695668 14.325-0.0695668 13.9929 0.27223L7.74293 6.52223L1.49293 0.27223C1.1609-0.0695668 0.58473-0.0793324 0.252699 0.27223C-0.0793324 0.614027-0.0793324 1.17067 0.252699 1.5027L6.5027 7.7527L0.252699 14.0125C-0.0793324 14.3445-0.0890981 14.9109 0.252699 15.2429Z"
                fill-opacity="0.85" />
            </g>
          </svg>
        </div>

        <div class="scroll">

          <h4>
            <input type="checkbox" v-model="enablePlayerFilter">
            Игрок
          </h4>
          <input type="text" v-if="enablePlayerFilter" placeholder="Никнейм" v-model="nickname">

          <h4>
            <input type="checkbox" v-model="enableLevelFilter">
            Уровень
          </h4>
          <div v-if="enableLevelFilter" class="flex hor variant-selector">
            <div v-for="item in ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const)" class="clickable-variant"
              @click="clickLevel(item)" :class="selectedLevels.includes(item) ? 'selected' : ''">{{ item }}
            </div>
          </div>

          <h4>
            <input type="checkbox" v-model="enableTypeFilter">
            Класс
          </h4>
          <div v-if="enableTypeFilter" class="flex hor variant-selector">
            <div v-for="item in ([['ЛТ', 'LT'], ['СТ', 'MT'], ['ТТ', 'HT'], ['ПТ', 'AT'], ['САУ', 'SPG']] as const)"
              class="clickable-variant" :class="selectedClasses.includes(item[1]) ? 'selected' : ''"
              @click="clickClass(item[1])">{{ item[0] }}</div>
          </div>


          <h4>
            <input type="checkbox" v-model="enableTankFilter">
            Танк
            <span class="reset" v-if="selectedTanks.length" @click="clearTankFilter"><a>Сбросить</a></span>
          </h4>
          <div v-if="enableTankFilter" class="tank-selector flex ver gap-0">
            <input type="text" placeholder="Поиск" v-model="searchText">

            <div v-bind="sortedTankContainerProps" class="tank-list">
              <div v-bind="sortedTankWrapperProps">
                <div v-for="item in sortedTankList" :key="item.index" class="tank" @click="clickTank(item.data)"
                  :class="selectedTanks.map(t => t.tag).includes(item.data.tag) ? 'selected' : ''">
                  {{ item.data.name }}
                </div>
              </div>
            </div>
          </div>

          <h4>Режим</h4>
          <select v-model="battleMode">
            <option value="any">Любой</option>
            <option v-for="mode in customBattleModesKeys" :value="mode">{{ customBattleModes[mode].title }}</option>
          </select>

          <!-- <h4>Режим</h4>
          <select v-model="battleMode">
            <option value="any">Любой</option>
            <option v-for="mode in battleModesKeys" :value="mode">{{ battleModes[mode] }}</option>
          </select>

          <h4>Геймплей</h4>
          <select v-model="battleGameplay">
            <option value="any">Любой</option>
            <option v-for="mode in battleGameplaysKeys" :value="mode">{{ battleGameplays[mode] }}</option>
          </select> -->

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
            v-if="((periodVariant == 'fromTo' && fromDate && toDate) || (periodVariant == 'fromToNow' && fromDate)) && nickname != '' && enablePlayerFilter">
            <h5>Точные границы периода по боям</h5>

            <svg width="100%" height="80" ref="moveContainer" class="battle-timeline">
              <g>
                <g v-for="tick in timelineLabels.ticks">
                  <line :x1="tick.x + '%'" y1="5" :x2="tick.x + '%'" y2="35" class="tick" />
                  <text v-if="tick.labels && tick.x > 10 && tick.x < 90" :x="tick.x + '%'" y="55" text-anchor="middle"
                    class="date">{{ tick.labels }}</text>
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

              <path :d="`M ${leftXPosition * boundingWidth} 5 m 11 0 l -10 0 l 0 30 l 10 0`" stroke-width="2"
                fill="none" class="move" ref="left" />

              <path v-if="periodVariant == 'fromTo'"
                :d="`M ${rightXPosition * boundingWidth} 5 m -11 0 l 10 0 l 0 30 l -10 0`" stroke-width="2" fill="none"
                class="move" ref="right" />
            </svg>
          </div>
        </div>
        <button @click="apply">Применить</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { dateToDbIndex, query, queryAsync } from '@/db'
import { computed, onMounted, onUnmounted, ref, shallowRef, toRaw, toValue, watch } from 'vue'
import { useDebounce, useDraggable, useElementBounding, watchOnce, useVirtualList } from '@vueuse/core'
import { TankLevel, TankType, useQueryStatParams } from '@/composition/useQueryStatParams'
import { customBattleModes, customBattleModesKeys } from '@/utils/wot'
import { useRoute, useRouter } from 'vue-router'
import { getTankName } from '@/utils/i18n'

const route = useRoute()
const router = useRouter()

const emit = defineEmits<{
  close: [];
}>()

const props = defineProps<{
  reload?: boolean
}>()

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

const enablePlayerFilter = ref(false)
const enableLevelFilter = ref(false)
const enableTypeFilter = ref(false)
const enableTankFilter = ref(false)


const leftXPosition = ref(0)
const rightXPosition = ref(1)

const moveContainer = ref<SVGElement | null>(null)
const { left: boundingLeft, width: boundingWidth } = useElementBounding(moveContainer)
const left = ref<SVGPathElement | null>(null)
const right = ref<SVGPathElement | null>(null)

useDraggable(left, {
  axis: 'x',
  onMove: (e) => leftXPosition.value = Math.min(boundingWidth.value - 20, Math.max(0, e.x - boundingLeft.value)) / boundingWidth.value
})

useDraggable(right, {
  axis: 'x',
  onMove: (e) => rightXPosition.value = Math.min(boundingWidth.value, Math.max(20, 12 + e.x - boundingLeft.value)) / boundingWidth.value
})


const nickname = ref('')
const periodVariant = ref<'allTime' | 'lastX' | 'fromTo' | 'fromToNow'>('allTime')
const selectedClasses = ref<(TankType)[]>([])
const selectedLevels = ref<(TankLevel)[]>([])
const selectedTanks = ref<(Tank)[]>([])
const playerBattles = shallowRef<Battle[]>([])
const battleMode = ref<keyof typeof customBattleModes | 'any'>('any')
const fromDate = shallowRef<string | null>(null)
const toDate = shallowRef<string | null>(null)
const lastX = ref(10)

const tankList = queryAsync<{
  type: 'MT' | 'LT' | 'HT' | 'AT' | 'SPG',
  tag: string, level: TankLevel
}>(`
select tankTag as tag, 
       tankType as type, 
       tankLevel as level 
from Event_OnBattleStart
group by tankTag, tankType, tankLevel
having count() > 10;
`)

const tanks = computed(() => tankList.value.data.map(t => {
  return {
    tankLevel: t.level,
    tankType: t.type,
    tankTag: t.tag,
    tankName: getTankName(t.tag, false),
    shortName: getTankName(t.tag, true)
  }
}))

const tanksProcessed = computed(() => tanks.value.map(t => ({
  level: t.tankLevel,
  type: t.tankType,
  tag: t.tankTag,
  name: t.tankName,
  short: t.shortName,
})))

const queryParams = toValue(useQueryStatParams())
if (queryParams.player) { nickname.value = queryParams.player; enablePlayerFilter.value = true }
if (queryParams.level) { selectedLevels.value = queryParams.level; enableLevelFilter.value = true }
if (queryParams.types) { selectedClasses.value = queryParams.types; enableTypeFilter.value = true }
if (queryParams.battleMode) battleMode.value = queryParams.battleMode
if (queryParams.tanks != null) {
  const tanks = queryParams.tanks
  watchOnce(tanksProcessed, () => {
    selectedTanks.value = tanksProcessed.value.filter(t => tanks.includes(t.tag))
  })
  enableTankFilter.value = true
}

if (queryParams.period !== 'allTime') {
  const period = queryParams.period
  if (period.type == 'lastX') {
    periodVariant.value = 'lastX'
    lastX.value = period.count
  } else if (period.type == 'fromToNow') {
    periodVariant.value = 'fromToNow'
    const date = period.from.toISOString().substring(0, 10)
    fromDate.value = date
    const dateFrom = new Date(date)

    const delta = new Date().getTime() - dateFrom.getTime()
    leftXPosition.value = (period.from.getTime() - dateFrom.getTime()) / delta
  } else if (period.type == 'fromTo') {
    periodVariant.value = 'fromTo'
    const fromDateStr = period.from.toISOString().substring(0, 10)
    const targetStr = period.to.toISOString().substring(0, 10)
    const targetDate = new Date(targetStr)
    targetDate.setDate(targetDate.getDate() + 1)

    fromDate.value = fromDateStr
    toDate.value = targetDate.toISOString().substring(0, 10)

    const dateFrom = new Date(fromDateStr)
    const delta = targetDate.getTime() - dateFrom.getTime()
    leftXPosition.value = (period.from.getTime() - dateFrom.getTime()) / delta
    rightXPosition.value = (period.to.getTime() - dateFrom.getTime()) / delta
  }
}

const debouncedNickname = useDebounce(nickname, 500)

const searchText = ref('')

function clickClass(params: TankType) {
  if (selectedClasses.value.includes(params)) {
    selectedClasses.value = selectedClasses.value.filter((i) => i != params)
  } else {
    selectedClasses.value.push(params)
  }
}

function clickLevel(params: TankLevel) {
  if (selectedLevels.value.includes(params)) {
    selectedLevels.value = selectedLevels.value.filter((i) => i != params)
  } else {
    selectedLevels.value.push(params)
  }
}

function clickTank(tank: Tank) {
  if (selectedTanks.value.map(t => t.tag).includes(tank.tag)) {
    selectedTanks.value = selectedTanks.value.filter((i) => i.tag != tank.tag)
  } else {
    selectedTanks.value.push(tank)
  }
}

function clearTankFilter() {
  selectedTanks.value = []
  enableTankFilter.value = false
}

watch(periodVariant, (val) => {
  if (val == 'allTime') {
    fromDate.value = null
    toDate.value = null
  } else if (val == 'fromToNow') {
    toDate.value = null
    leftXPosition.value = 0
    rightXPosition.value = 1
  } else if (val == 'fromTo') {
    leftXPosition.value = 0
    rightXPosition.value = 1
  }
})

watch(lastX, (val) => {
  if (val < 0) {
    lastX.value = 1
  }
})

watch(nickname, val => {
  playerBattles.value = []
})


const timeLineStart = shallowRef(new Date())
const timeLineEnd = shallowRef(new Date())

const timelineLabels = computed(() => {
  const start = timeLineStart.value
  const end = timeLineEnd.value

  const startT = start.getTime()
  const endT = end.getTime()

  if (startT == endT) {
    return {
      ticks: []
    }
  }

  const remapPercent = (val: Date) => (val.getTime() - startT) / (endT - startT) * 100

  const deltaInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

  let ticks = []
  if (deltaInMonths < 1) {
    for (var day = new Date(startT); day <= end; day.setDate(day.getDate() + 1)) {
      ticks.push({ x: remapPercent(day) })
    }
  } else {
    const startMonth = new Date(startT)
    startMonth.setDate(1)

    for (var month = startMonth; month <= end; month.setMonth(month.getMonth() + 1)) {
      if (deltaInMonths < 12) {
        ticks.push({ x: remapPercent(month), labels: shortDate(month) })
      } else {
        ticks.push({ x: remapPercent(month) })
      }
    }
  }

  return {
    ticks,
  }

})

function shortDate(date: Date) {
  return date.toLocaleString(undefined, {
    month: 'numeric', day: 'numeric',
  })
}

watch(() => [enablePlayerFilter.value, debouncedNickname.value, fromDate.value, toDate.value] as const, async ([enablePlayerFilter, nickname, fromDate, toDate]) => {
  if (!enablePlayerFilter || nickname == '') {
    playerBattles.value = []
    return
  }

  playerBattles.value = []

  const from = fromDate ? new Date(fromDate) : null
  const to = toDate ? new Date(toDate) : new Date()

  if (from) timeLineStart.value = new Date(from.getTime())
  if (to) timeLineEnd.value = new Date(to.getTime())

  const { data: battles } = await query<{ duration: number, id: number }>(`
  select duration, id 
  from Event_OnBattleResult 
  where playerName = '${nickname}'
  ${from ? `and id >= '${dateToDbIndex(from)}'` : ''}
  ${to ? `and id <= '${dateToDbIndex(to)}'` : ''}
  order by dateTime
  limit 400;
  `)

  const processed = battles.map(t => {
    const end = new Date(t.id / 1e10)
    const start = new Date(end.getTime() - t.duration * 1000)
    return {
      start: start.getTime(),
      end: end.getTime(),
    }
  })

  if (processed.length == 0) {
    playerBattles.value = []
    return
  }

  const min = from ? from.getTime() : processed[0].start
  const max = to ? to.getTime() : processed[processed.length - 1].end

  timeLineStart.value = new Date(min)
  timeLineEnd.value = new Date(max)


  playerBattles.value = processed.map(t => ({
    start: (t.start - min) / (max - min),
    end: (t.end - min) / (max - min)
  }))
}, { immediate: true })

const sortedTanks = computed<Tank[]>(() =>
  tanksProcessed.value
    .filter(t => selectedClasses.value.length == 0 || selectedClasses.value.includes(t.type))
    .filter(t => selectedLevels.value.length == 0 || selectedLevels.value.includes(t.level))
    .filter(t => searchText.value == '' ||
      t.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      t.short.toLowerCase().includes(searchText.value.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))
)

const { list: sortedTankList,
  containerProps: sortedTankContainerProps,
  wrapperProps: sortedTankWrapperProps } = useVirtualList(sortedTanks, { itemHeight: 34 })

watch(sortedTanks, () => {
  sortedTankContainerProps.ref.value?.scrollTo(0, 0)
})

function apply() {
  let target = window.location.pathname + '?'

  if (enablePlayerFilter.value && nickname.value != '') target += `nickname=${nickname.value}&`
  if (enableLevelFilter.value && selectedLevels.value.length > 0) target += `level=${selectedLevels.value.join(',')}&`
  if (enableTypeFilter.value && selectedClasses.value.length > 0) target += `type=${selectedClasses.value.join(',')}&`
  if (enableTankFilter.value && selectedTanks.value.length > 0) target += `tank=${selectedTanks.value.map(t => t.tag).join(',')}&`
  if (battleMode.value != 'normalAny') target += `mode=${battleMode.value}&`

  function processPeriod() {
    if (periodVariant.value == 'allTime') return
    if (periodVariant.value == 'lastX') return target += `lastX=${lastX.value}&`

    const processFromTo = () => {
      const from = new Date(fromDate.value!)
      const to = toDate.value ? new Date(toDate.value) : new Date()

      if (!enablePlayerFilter.value || nickname.value == '') return { from, to }

      const delta = to.getTime() - from.getTime()
      const fromT = new Date(from.getTime() + delta * leftXPosition.value)
      const toT = new Date(fromT.getTime() + delta * (rightXPosition.value - leftXPosition.value))

      return { from: fromT, to: toT }
    }

    if (periodVariant.value == 'fromToNow') {
      if (fromDate.value == null) return
      const { from } = processFromTo()
      target += `from=${from.toISOString()}&`
    } else if (periodVariant.value == 'fromTo') {
      if (fromDate.value == null || toDate.value == null) return
      const { from, to } = processFromTo()
      target += `from=${from.toISOString()}&to=${to.toISOString()}&`
    }
  }

  processPeriod()

  const keys = [
    'nickname',
    'level',
    'type',
    'tank',
    'mode',
    'lastX',
    'from',
    'to',
  ]

  target = target.slice(0, -1)
  if (props.reload !== false) {
    const old = Object.entries(route.query).filter(t => !keys.includes(t[0])).map(t => t.join('=')).join('&')

    if (old != '') target += (!target.includes('?') ? '?' : '&') + old

    window.open(target, '_self')
  } else {
    const targetParams = target.split('?')
    if (targetParams.length > 1) {
      const params = targetParams[1].split('&')
      const p = Object.fromEntries(params.map(t => t.split('=')))
      router.push({
        query: {
          ...route.query,
          ...Object.fromEntries(keys.map(t => [t, undefined])),
          ...p
        }
      })
    } else {
      router.push(target)
    }
  }

  if (props.reload !== true) emit('close')
}

onMounted(() => {
  document.body.classList.add('no-scroll')
  document.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.body.classList.remove('no-scroll')
  document.removeEventListener('keydown', onKey)
})

function onKey(params: KeyboardEvent) {
  if (params.key == 'Escape') {
    emit('close')
  }
}

</script>

<style>
.no-scroll {
  overflow: hidden;
}
</style>

<style lang="scss" scoped>
@use "/src/styles/mixins.scss" as *;

.title {
  align-items: center;

  .close {
    float: right;
    background-color: #8181813e;
    border-radius: 50%;
    padding: 8px;
    fill: var(--font-color);
    cursor: pointer;

    &:hover {
      background-color: #8181815e;
    }
  }
}

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
    overflow-x: hidden;
    height: 100%;
    max-height: 800px;

    @include small {
      width: 700px;
    }

    @include less-small {
      margin: 0;
      width: 100%;
      box-sizing: border-box;
      margin-top: 50px;
      height: 100%;
      max-height: 100%;
      border-end-end-radius: 0;
      border-end-start-radius: 0;
    }

    .scroll {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 20px;
      margin: 0 -20px;
      height: 100%;
    }

    h4,
    h5 {
      margin-bottom: 0;

      .reset {
        float: right;
        cursor: pointer;
      }
    }

    h2 {
      margin: 0;
    }
  }
}
</style>