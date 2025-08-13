<template>
  <div class="vehicle-selector">
    <PopupModal v-model="displayPopup" :target="targetElement" no-padding>
      <slot></slot>
      <template #popup>
        <div class="container">
          <header>
            <h1>Выбор техники
              <button class="reset" :class="shouldVisibleReset ? '' : 'disabled'" @click="reset">
                <Reload />
              </button>
            </h1>

            <div class="types mt-font">
              <div class="type selectable" @click="currentGame = 'Lesta'"
                :class="currentGame == 'Lesta' ? 'active' : ''">Lesta</div>
              <div class="type selectable" @click="currentGame = 'WG'" :class="currentGame == 'WG' ? 'active' : ''">
                WG</div>
              <div class="vr"></div>
              <div class="type selectable" :class="currentTypes.has(type) ? 'active' : ''" v-for="type in vehicleTypes"
                @click="e => selectType(e, type)">
                <VehicleTypeComponent :type="type" class="icon" />
              </div>
            </div>

            <div class="nations mt-font">
              <div class="nation selectable" v-for="nation in nations"
                :class="currentNations.has(nation) ? 'active' : ''" @click="e => selectNation(e, nation)">
                <NationComponent :nation="nation" class="flag" />
              </div>
            </div>

            <div class="levels mt-font">
              <div class="level selectable" :class="currentLevels.has(i + 1) ? 'active' : ''"
                v-for="(_, i) in new Array(currentGame == 'Lesta' ? 11 : 10)" @click="e => selectLevel(e, i + 1)">
                {{ numberToRoman(i + 1) }}
              </div>
            </div>

            <div class="search">
              <Search class="search-icon" />
              <input type="text" placeholder="Поиск по названию" v-model="currentSearch" ref="searchInout" />
              <X class="close-icon" :class="currentSearch == '' ? 'empty' : ''" @click="currentSearch = ''" />
            </div>
          </header>

          <VehicleTable :tank-to-display="tankToDisplay" ref="vehicleTable" v-model:name-variant="nameVariant"
            v-model:selected="vehicles" />
        </div>
      </template>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">

import PopupModal from '../PopupModal.vue'
import { computed, ref, watch } from 'vue'
import { CACHE_SETTINGS, queryAsync } from '@/db'
import { selectTagVehiclesLocalization, tankTagToReadable } from '@/utils/i18n'
import { highlight, compareIntervals } from '../highlightString/highlightUtils'
import { useFocus, useLocalStorage } from '@vueuse/core'

import VehicleTable from './VehicleTable.vue'

import Search from '@/assets/icons/search.svg'
import X from '@/assets/icons/x.svg'
import Reload from '@/assets/icons/reset.svg'
import { numberToRoman } from '@/utils'
import VehicleTypeComponent from '../vehicles/type/VehicleType.vue'
import { Nation, nations, nationsIndexes, type VehicleType, vehicleTypes } from '@/utils/wot'
import NationComponent from '../vehicles/nation/Nation.vue'


const searchInout = ref<HTMLInputElement | null>(null)
const vehicleTable = ref<InstanceType<typeof VehicleTable> | null>(null)

const currentSearch = ref('')
const currentGame = useLocalStorage<'Lesta' | 'WG'>('preferred-game-variant', 'Lesta')
const currentLevels = ref(new Set<number>())
const currentTypes = ref(new Set<VehicleType>())
const currentNations = ref(new Set<Nation>())
const nameVariant = useLocalStorage<'full' | 'short'>('preferred-vehicle-name-variant', 'full')

defineProps<{
  targetElement?: HTMLElement | null,
}>()
const vehicles = defineModel<Set<string>>({ required: true })
const displayPopup = defineModel<boolean>('displayPopup')

useFocus(searchInout, { initialValue: true })


function isRegionForCurrentGame(region: string) {
  return currentGame.value == 'Lesta' ? region == 'RU' : region == 'EU'
}


const tankList = queryAsync<{
  type: 'MT' | 'LT' | 'HT' | 'AT' | 'SPG',
  tag: string, level: number, short: string, name: string, region: string
}>(`
with
    tanks as (select tag, type, level, role, region, from LatestBattleVehicleInfo final),
    locals as (${selectTagVehiclesLocalization})
select tag, type, role, level, short, name, region
from tanks
left any join locals using tag;
`, { settings: CACHE_SETTINGS })

const tankToDisplay = computed(() => {
  const filtered = tankList.value.data
    .filter(t =>
      isRegionForCurrentGame(t.region) &&
      (currentLevels.value.has(t.level) || currentLevels.value.size == 0) &&
      (currentTypes.value.has(t.type) || currentTypes.value.size == 0) &&
      (currentNations.value.has(t.tag.split(':')[0] as Nation) || currentNations.value.size == 0)
    )
    .map(tank => {
      const name = nameVariant.value == 'full' ? tank.name : tank.short

      return {
        tag: tank.tag,
        level: tank.level,
        nation: tank.tag.split(':')[0],
        type: tank.type,
        short: tank.short,
        highlightStrings: highlight(name || tankTagToReadable(tank.tag), currentSearch.value)
      }
    })
    .filter(tank => !currentSearch.value || tank.highlightStrings.highlight.length > 0)

  function compare(a: typeof filtered[number], b: typeof filtered[number]) {
    if (a.level !== b.level) return b.level - a.level
    if (a.nation !== b.nation) {
      const aIndex = nationsIndexes.get(a.nation as any) ?? 0
      const bIndex = nationsIndexes.get(b.nation as any) ?? 0
      return aIndex - bIndex
    }
    return a.highlightStrings.text.localeCompare(b.highlightStrings.text)
  }

  if (currentSearch.value)
    return filtered.sort((a, b) => {
      const comp = compareIntervals(a.highlightStrings.highlight, b.highlightStrings.highlight)
      if (comp !== 0) return comp
      return compare(a, b)
    })

  return filtered.sort((a, b) => compare(a, b))
})

const shouldVisibleReset = computed(() => currentLevels.value.size > 0 || currentTypes.value.size > 0 || currentNations.value.size > 0 || currentSearch.value != '')

watch(currentGame, game => { if (game == 'WG') currentLevels.value.delete(11) })

function selectLevel(e: MouseEvent, level: number) {
  if (currentLevels.value.has(level)) currentLevels.value.delete(level)
  else {
    if (e.shiftKey) {
      const levels = Array.from(currentLevels.value)
      const min = Math.min(...levels)
      const max = Math.max(...levels)

      if (level < min) for (let i = level; i <= max; i++) currentLevels.value.add(i)
      else for (let i = min; i <= level; i++) currentLevels.value.add(i)
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
      const index = nationsIndexes.get(nation)!
      const nationsI = Array.from(currentNations.value).map(n => nationsIndexes.get(n)!)
      const min = Math.min(...nationsI)
      const max = Math.max(...nationsI)

      if (index < min) for (let i = index; i <= max; i++) currentNations.value.add(nations[i])
      else for (let i = min; i <= index; i++) currentNations.value.add(nations[i])
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
.vehicle-selector {
  display: flex;
  align-items: baseline;
  gap: 0.2em;
}

.container {
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

    .search {
      width: 100%;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      display: flex;
      align-items: center;
      height: 30px;

      input {
        border: none;
        background-color: transparent;
        width: 100%;
        height: 100%;
        font-size: 14px;
        padding: 0;
      }

      .search-icon {
        height: 17px;
        margin: 0 8px;
        fill: currentColor;
      }

      .close-icon {
        height: 15px;
        padding: 5px;
        margin: 0 2px;
        fill: currentColor;
        transition: color 0.2s;
        cursor: pointer;

        &.empty {
          color: #ffffff00;
        }

        &:not(.empty):hover {
          color: #d1d1d1;
        }
      }
    }
  }

}
</style>