<template>
  <div class="game-version-selector-popup-container">
    <header>
      <h1>Выбор версии игры</h1>
      <div class="game mt-font">
        <button class="variant selectable" @click="preferredGame = 'mt'" :class="preferredGame == 'mt' ? 'active' : ''">
          Lesta
        </button>
        <button class="variant selectable" @click="preferredGame = 'wot'"
          :class="preferredGame != 'mt' ? 'active' : ''">
          WG
        </button>
      </div>
      <div class="region mt-font">
        <button class="variant selectable" :class="currentRegions.has(region) ? 'active' : ''" :key="region"
          v-for="region in possibleRegions" @click="e => selectRegion(e, region)">
          {{ region }}
        </button>
      </div>

      <SearchLine v-model="currentSearch" />
    </header>

    <div class="content">
      <div class="separator"></div>
      <div class="table-container deep-nice-scrollbar" :class="{ 'fast-scroll': isFastScroll }">
        <TableView ref="table" backgroundColor="#2a2a2a" :delegate />
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { preferredGame } from '@/utils/globalPreferred'
import SearchLine from '@/components/searchLine/SearchLine.vue'
import TableView from '@/components/tableView/TableView.vue'
import { TableViewDelegate } from '@/components/tableView/tableView/TableView'
import { HeaderLine } from '../tableView/tableView/default/HeaderLine'
import { VersionLine } from './VersionLine'
import { compareIntervals, Highlighted } from '../highlightString/highlightUtils'



const props = defineProps<{
  versionList: {
    region: string, version: string
  }[]
}>()

const versions = defineModel<Set<string>>({ required: true })
const table = ref<InstanceType<typeof TableView> | null>(null)

const currentSearch = ref('')
const currentRegions = ref<Set<string>>(new Set())


const regionsForGame = {
  'mt': ['RU', 'PT_RU'],
  'wot': ['EU', 'NA', 'ASIA', 'CN', 'CT'],
}

const possibleRegions = computed(() => {
  return preferredGame.value == 'mt' ? regionsForGame['mt'] : regionsForGame['wot']
})

watch(preferredGame, (newGame, old) => {
  if (newGame === old) return
  currentRegions.value.clear()
  if (newGame === 'mt') currentRegions.value.add('RU')
  else currentRegions.value.add('EU')

}, { immediate: true })


function selectRegion(e: MouseEvent, region: string) {
  if (currentRegions.value.has(region)) currentRegions.value.delete(region)
  else {
    if (e.shiftKey) {
      if (currentRegions.value.size === 0) {
        currentRegions.value.add(region)
      } else {
        const index = possibleRegions.value.indexOf(region)
        const regionsI = Array.from(currentRegions.value).map(n => possibleRegions.value.indexOf(n))

        const min = Math.min(...regionsI)
        const max = Math.max(...regionsI)

        if (index < min) for (let i = index; i <= max; i++) currentRegions.value.add(possibleRegions.value[i])
        else for (let i = min; i <= index; i++) currentRegions.value.add(possibleRegions.value[i])
      }
    }
    else if (!e.ctrlKey && !e.metaKey) currentRegions.value.clear()

    if (!e.shiftKey) currentRegions.value.add(region)
  }
}

const prepared = computed(() => {
  return props.versionList.map(item => ({
    region: item.region,
    version: item.version,
    highlighted: new Highlighted(item.version)
  }))
})

const grouped = computed(() => {
  return [{
    header: 'Версии',
    lines: prepared.value
  }]
})

const displaySections = computed(() => {
  const regions = currentRegions.value
  const search = currentSearch.value

  const filteredGroups = grouped.value.map(list => {
    const prefiltered = list.lines.filter(item => regions.has(item.region))

    for (const element of prefiltered) {
      element.highlighted.setSubstring(search)
    }

    const filtered = prefiltered.filter(item => !search || item.highlighted.intervals.length > 0)

    function sorted() {
      if (search) return filtered.sort((a, b) => {
        const comp = compareIntervals(a.highlighted.intervals, b.highlighted.intervals)
        if (comp !== 0) return comp
        return -a.highlighted.text.localeCompare(b.highlighted.text)
      })

      return filtered.sort((a, b) => -a.highlighted.text.localeCompare(b.highlighted.text))
    }

    return {
      header: list.header,
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

let sections: typeof displaySections.value = []

watch(() => displaySections.value, list => {
  sections = list
  table.value?.dataDidUpdate()
  table.value?.scrollTo({ section: 0, row: 0 }, 'instant')
}, { immediate: true })

const scrollVelocity = ref(0)
const isFastScroll = computed((old) => {
  const velocity = Math.abs(scrollVelocity.value)

  if (old && velocity < 100) return false
  if (!old && velocity >= 1000) return true

  return old
})

function onClick(tag: string) {
  if (versions.value?.has(tag)) versions.value?.delete(tag)
  else versions.value?.add(tag)
}

const delegate: TableViewDelegate = {

  onSetupComplete: (table) => {
    table.registerReusable(HeaderLine.reusableKey, () => new HeaderLine())
    table.registerReusable(VersionLine.reusableKey, () => new VersionLine(onClick, versions), 50)
  },

  numberOfSections: () => sections.length,
  numberOfRowsInSection: (_, section) => sections[section].lines.length,

  heightForCellByIndex: (_, index) => 35,
  cellForIndex: (table, index) => {
    const cell = table.getReusable<VersionLine>(VersionLine.reusableKey)
    cell.configure(sections[index.section].lines[index.row])
    return { cell, reusableKey: VersionLine.reusableKey }
  },

  heightForHeaderInSection: (_, section) => 33,
  headerCellForSection: (table, section) => {
    const cell = table.getReusable<HeaderLine>(HeaderLine.reusableKey)
    cell.setTitle(sections[section].header)
    return { header: cell, reusableKey: HeaderLine.reusableKey }
  },

  onScrollVelocityChange: (_, velocity) => scrollVelocity.value = velocity
}

</script>


<style lang="scss" scoped>
.game-version-selector-popup-container {
  padding: 15px;
  padding-bottom: 0;

  header {

    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 200px;


    h1 {
      font-size: 1em;
      margin: 0;
      margin-bottom: 10px;
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

    .region,
    .game {
      display: flex;
      gap: 5px;
      justify-content: center;

      .vr {
        width: 1px;
        background-color: rgba(255, 255, 255, 0.1);
      }

      .variant {
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

    .region {
      .variant {
        padding: 0;
      }
    }

  }

  .content {
    .separator {
      height: 1px;
      background-color: rgba(255, 255, 255, 0.1);
      margin: 0px -15px;
    }

    .table-container {
      height: 250px;
      position: relative;
      margin-right: -11.5px;
      margin-left: -10px;
      user-select: none;
    }


    :deep(.table-container) {
      &.fast-scroll {
        .line:not(.selected) {
          &::before {
            opacity: 0;
          }
        }
      }

      .line {
        display: flex;
        white-space: nowrap;
        height: 34px;
        align-items: center;
        border-top: 1px solid #d0d0d008;
        position: relative;
        cursor: pointer;
        margin: 0 3px;
        padding-left: 7px;
        padding-right: 3px;
        z-index: 1;

        &::before {
          content: '';
          position: absolute;
          inset: 0 0px 0 0px;
          border-radius: 6px;
          z-index: -1;
        }

        @media (hover: hover) and (pointer: fine) {
          &:hover::before {
            background: rgba(255, 255, 255, 0.1);
          }
        }

        &.selected::before {
          background: linear-gradient(90deg, #0182faa8, transparent) !important;
        }

        p {
          .highlight {
            color: var(--blue-thin-color);
          }
        }
      }
    }
  }
}
</style>