<template>
  <div class="vehicle-selector-popup-container">
    <header>
      <h1>Выбор техники
        <button class="reset" :class="shouldVisibleReset ? '' : 'disabled'" @click="reset">
          <Reload />
        </button>
      </h1>

      <div class="types mt-font">
        <button class="type selectable" @click="preferredGame = 'mt'" :class="preferredGame == 'mt' ? 'active' : ''">
          Lesta
        </button>
        <button class="type selectable" @click="preferredGame = 'wot'" :class="preferredGame != 'mt' ? 'active' : ''">
          WG
        </button>
        <div class="vr"></div>
        <button class="type selectable" :class="currentTypes.has(type) ? 'active' : ''" v-for="type in vehicleTypes"
          @click="e => selectType(e, type)">
          <VehicleTypeComponent :type="type" class="icon" />
        </button>
      </div>

      <div class="nations mt-font">
        <button class="nation selectable" v-for="nation in (preferredGame == 'mt' ? mtNations : wotNations)"
          :class="currentNations.has(nation) ? 'active' : ''" @click="e => selectNation(e, nation)">
          <NationComponent :nation="nation" class="flag" />
        </button>
      </div>

      <div class="levels mt-font">
        <button class="level selectable" :class="currentLevels.has(i + 1) ? 'active' : ''"
          v-for="(_, i) in new Array(11)" @click="e => selectLevel(e, i + 1)">
          {{ romanNumberProcessor(i + 1) }}
        </button>
      </div>

      <SearchLine v-model="currentSearch" autofocus />
    </header>

    <div class="content">
      <VehicleTable :display-sections="tankToDisplay" ref="vehicleTable" v-model:name-variant="nameVariant"
        v-model:selected="vehicles" :game="preferredGame == 'wot' ? 'wot' : 'mt'" />

      <div class="loading" v-if="props.tankList.length === 0">
        <Loader />
      </div>
      <div class="empty-list" v-else-if="tankToDisplay.length === 0">
        <h5>Танков не найдено</h5>
        <button @click="reset">Очистить фильтр</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { tankTagToReadable } from '@/shared/i18n/i18n'
import { Highlighted, compareIntervals } from '@/shared/uiKit/highlightString/highlightUtils'
import { useLocalStorage } from '@vueuse/core'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'

import VehicleTable from './VehicleTable.vue'

import Reload from '@/assets/icons/reset.svg'
import VehicleTypeComponent from '@/shared/game/vehicles/type/VehicleType.vue'
import NationComponent from '@/shared/game/vehicles/nations/Nation.vue'
import SearchLine from '../components/searchLine/SearchLine.vue'
import { preferredGame } from '@/shared/global/globalPreferred'
import { mtNations, wotNations, nations, nationsIndexes, Nation } from '@/shared/game/vehicles/nations/nations'
import { VehicleType, vehicleTypes } from '@/shared/game/vehicles/vehicle/utils'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'

const vehicleTable = ref<InstanceType<typeof VehicleTable> | null>(null)

const currentSearch = ref('')
const currentLevels = ref(new Set<number>())
const currentTypes = ref(new Set<VehicleType>())
const currentNations = ref(new Set<Nation>())
const nameVariant = useLocalStorage<'full' | 'short'>('preferred-vehicle-name-variant', 'full')

const props = defineProps<{
  tankList: {
    type: 'MT' | 'LT' | 'HT' | 'AT' | 'SPG',
    tag: string, level: number, short: string, name: string, region: string, nation: Nation
  }[]
}>()

const vehicles = defineModel<Set<string>>({ required: true })

const preparedTankList = computed(() => {
  return props.tankList.map(tank => {

    const shortName = tank.short || tankTagToReadable(tank.tag)
    const name = tank.name || tankTagToReadable(tank.tag)

    return {
      region: tank.region,
      tag: tank.tag,
      level: tank.level,
      nation: tank.tag.split(':')[0] as Nation,
      type: tank.type,
      shortName,
      name,
      highlightedShort: new Highlighted(shortName),
      highlightedName: new Highlighted(name),
      highlighted: new Highlighted(name)
    }
  })
})

const groupedList = computed(() => {
  type Data = typeof preparedTankList.value
  const regular: Data = []
  const stealHunter: Data = []
  const hb25: Data = []
  const may24Hb: Data = []
  const race: Data = []
  const observer: Data = []
  const space: Data = []
  const bob: Data = []
  const _7x7: Data = []
  const lastWT: Data = []
  const test: Data = []
  const grinch: Data = []
  const fep23: Data = []
  const hw21: Data = []
  const halloween: Data = []
  const lsPlayer: Data = []

  const raceTags = new Set([
    'uk:GB00_AEC_Armoured_Car_02',
    'uk:GB00_AEC_Armoured_Car_03',
    'france:F00_AMD_Panhard_178B_02',
    'france:F00_AMD_Panhard_178B_03'
  ])

  const forceRegular = new Set([
    'ussr:R164_U_18_T'
  ])

  const lastWt = new Set([
    'czech:Cz04_T50_51_Waf_Hound_3DSt',
    'ussr:R232_IS-7W',
    'ussr:R232_IS-7G'
  ])

  for (const tank of preparedTankList.value) {
    if (forceRegular.has(tank.tag)) regular.push(tank)
    else if (tank.tag.endsWith('_SH')) stealHunter.push(tank)
    else if (tank.tag.endsWith('_hb25')) hb25.push(tank)
    else if (tank.tag.endsWith('_may24_hb')) may24Hb.push(tank)
    else if (tank.tag.endsWith('_bob')) bob.push(tank)
    else if (tank.tag.endsWith('_7x7')) _7x7.push(tank)
    else if (tank.tag.endsWith('_T')) test.push(tank)
    else if (tank.tag == 'ussr:Observer') observer.push(tank)
    else if (raceTags.has(tank.tag)) race.push(tank)
    else if (tank.tag.includes('_COSM_')) space.push(tank)
    else if (tank.tag.includes('_TLXXL') || lastWt.has(tank.tag)) lastWT.push(tank)
    else if (tank.tag.endsWith('_grinch')) grinch.push(tank)
    else if (tank.tag.endsWith('_FEP23')) fep23.push(tank)
    else if (tank.tag.endsWith('_hw21') || tank.tag.endsWith('_HW')) hw21.push(tank)
    else if (tank.tag.endsWith('_Halloween_event')) halloween.push(tank)
    else if (tank.tag.endsWith('_LS_PLAYER')) lsPlayer.push(tank)
    else regular.push(tank)
  }

  return [
    { header: 'Доступные в рандоме', data: regular },
    { header: 'Стальной Охотник', data: stealHunter },
    { header: 'Последний WT', data: lastWT },
    { header: 'Гонки', data: race },
    { header: 'На марс', data: space },
    { header: 'Битва блогеров', data: bob },
    { header: '7x7', data: _7x7 },
    { header: 'День рождения 2025', data: hb25 },
    { header: 'Гринч', data: grinch },
    { header: 'FEP23', data: fep23 },
    { header: 'Хэллоуин', data: halloween },
    { header: 'Май 2024', data: may24Hb },
    { header: 'HW21', data: hw21 },
    { header: 'Тестовые', data: test },
    { header: 'Служебные', data: observer },
  ]
})

const tankToDisplay = computed(() => {

  const currentLevelsCached = new Set(currentLevels.value)
  const currentTypesCached = new Set(currentTypes.value)
  const currentNationsCached = new Set(currentNations.value)
  const currentSearchCached = currentSearch.value

  const hasLevels = currentLevelsCached.size > 0
  const hasTypes = currentTypesCached.size > 0
  const hasNations = currentNationsCached.size > 0

  const filteredGroups = groupedList.value.map(tankList => {

    const targetRegion = preferredGame.value == 'mt' ? 'RU' : 'EU'
    const data = tankList.data

    const prefiltered = data
      .filter(t =>
        t.region == targetRegion &&
        (!hasLevels || currentLevelsCached.has(t.level)) &&
        (!hasTypes || currentTypesCached.has(t.type)) &&
        (!hasNations || currentNationsCached.has(t.nation))
      )

    for (const tank of prefiltered) {
      tank.highlighted = nameVariant.value == 'full' ? tank.highlightedName : tank.highlightedShort
      tank.highlighted.setSubstring(currentSearchCached)
    }

    const filtered = prefiltered.filter(tank => !currentSearchCached || tank.highlighted.intervals.length > 0)

    function compare(a: typeof filtered[number], b: typeof filtered[number]) {
      if (a.level !== b.level) return b.level - a.level
      if (a.nation !== b.nation) {
        const aIndex = nationsIndexes.get(a.nation as any) ?? 0
        const bIndex = nationsIndexes.get(b.nation as any) ?? 0
        return aIndex - bIndex
      }
      return a.highlighted.text.localeCompare(b.highlighted.text)
    }

    function sorted() {
      if (currentSearchCached) return filtered.sort((a, b) => {
        const comp = compareIntervals(a.highlighted.intervals, b.highlighted.intervals)
        if (comp !== 0) return comp
        const lc = a.highlighted.text.localeCompare(b.highlighted.text)
        if (lc !== 0) return lc
        return compare(a, b)
      })

      return filtered.sort((a, b) => compare(a, b))
    }

    return {
      header: tankList.header,
      data: sorted()
    }
  })

  return filteredGroups
    .filter(tankList => tankList.data.length > 0)
    .map(t => ({
      header: t.header,
      lines: t.data
    }))
})

const shouldVisibleReset = computed(() => currentLevels.value.size > 0 || currentTypes.value.size > 0 || currentNations.value.size > 0 || currentSearch.value != '')

function selectLevel(e: MouseEvent, level: number) {
  if (currentLevels.value.has(level)) currentLevels.value.delete(level)
  else {
    if (e.shiftKey) {
      if (currentLevels.value.size === 0) {
        currentLevels.value.add(level)
      } else {
        const levels = Array.from(currentLevels.value)
        const min = Math.min(...levels)
        const max = Math.max(...levels)

        if (level < min) for (let i = level; i <= max; i++) currentLevels.value.add(i)
        else for (let i = min; i <= level; i++) currentLevels.value.add(i)
      }
    }
    else if (!e.ctrlKey && !e.metaKey) currentLevels.value.clear()

    if (!e.shiftKey) currentLevels.value.add(level)
  }
}

function selectType(e: MouseEvent, type: VehicleType) {
  if (currentTypes.value.has(type)) currentTypes.value.delete(type)
  else {
    if (e.shiftKey) {
      if (currentTypes.value.size === 0) {
        currentTypes.value.add(type)
      } else {
        const index = vehicleTypes.indexOf(type)
        const types = Array.from(currentTypes.value).map(t => vehicleTypes.indexOf(t))
        const min = Math.min(...types)
        const max = Math.max(...types)

        if (index < min) for (let i = index; i <= max; i++) currentTypes.value.add(vehicleTypes[i])
        else for (let i = min; i <= index; i++) currentTypes.value.add(vehicleTypes[i])
      }
    }
    else if (!e.ctrlKey && !e.metaKey) currentTypes.value.clear()

    if (!e.shiftKey) currentTypes.value.add(type)
  }
}

function selectNation(e: MouseEvent, nation: Nation) {
  if (currentNations.value.has(nation)) currentNations.value.delete(nation)
  else {
    if (e.shiftKey) {
      if (currentNations.value.size === 0) {
        currentNations.value.add(nation)
      } else {
        const index = nationsIndexes.get(nation)!
        const nationsI = Array.from(currentNations.value).map(n => nationsIndexes.get(n)!)
        const min = Math.min(...nationsI)
        const max = Math.max(...nationsI)

        if (index < min) for (let i = index; i <= max; i++) currentNations.value.add(nations[i])
        else for (let i = min; i <= index; i++) currentNations.value.add(nations[i])
      }
    }
    else if (!e.ctrlKey && !e.metaKey) currentNations.value.clear()

    if (!e.shiftKey) currentNations.value.add(nation)
  }
}

function reset() {
  currentLevels.value.clear()
  currentTypes.value.clear()
  currentNations.value.clear()
  currentSearch.value = ''
}

</script>

<style scoped lang="scss">
.vehicle-selector-popup-container {
  padding: 15px;
  padding-bottom: 0;

  header {

    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;


    h1 {
      font-size: 1em;
      margin: 0;
      margin-bottom: 10px;

      position: relative;

      .reset {
        position: absolute;
        right: 0;
        top: -2px;
        border: none;
        border-radius: 20px;
        background-color: rgba(255, 255, 255, 0.08);
        transition: background-color 0.2s, opacity 0.2s;
        padding: 0;
        height: 23px;
        width: 23px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        color: rgba(255, 255, 255, 0.9);

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        &.disabled {
          opacity: 0;
          pointer-events: none;
        }
      }
    }

    button {
      border: none;
    }

    .selectable {
      background-color: rgba(255, 255, 255, 0.08);
      border-radius: 5px;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.07s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      &.active {
        background-color: var(--blue-color);
      }
    }

    .levels {
      display: flex;
      gap: 5px;
      justify-content: center;

      .level {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9em;
        flex: 1;
        text-align: center;
        padding: 0 5px;
        height: 22px;
      }
    }

    .nations {
      display: flex;
      gap: 1px;
      margin: -2px;
      height: 20px;

      .nation {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        border-radius: 5px;
        padding: 2px;
        background-color: transparent;

        .flag {
          flex: 1;
          min-width: auto;
          width: 10px;
          user-select: none;
          pointer-events: none;
          border-radius: 3px;
          transition: filter 0.1s;
          filter: brightness(1.1)
        }

        &:hover {
          .flag {
            filter: brightness(1.8)
          }
        }

        &.active {
          background-color: var(--blue-thin-color);

          .flag {
            filter: brightness(1.8);
          }
        }
      }
    }

    .types {
      display: flex;
      gap: 5px;
      justify-content: center;

      .vr {
        width: 1px;
        background-color: rgba(255, 255, 255, 0.1);
      }

      .type {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        height: 22px;
        padding: 0 10px;
        line-height: 1;
        font-size: 0.9em;

        .icon {
          height: 14px;
        }
      }
    }
  }

  .content {
    position: relative;

    .loading,
    .empty-list {
      position: absolute;
      inset: 30px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .empty-list {
      h5 {
        margin: 0;
        font-size: 1em;
      }

      button {
        background-color: transparent;

        color: var(--blue-thin-color);
        font-size: 0.9em;
        border: none;
        transition: color 0.2s;

        &:hover {
          color: var(--blue-thin-color-hover);
        }
      }

    }
  }

}
</style>