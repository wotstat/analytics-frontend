<template>
  <div class="table">
    <div class="table-header">
      <p class="flag">
        <Globe class="img" />
      </p>
      <p class="type">
        <VehicleType :type="'any'" class="img" />
      </p>
      <p class="level mt-font">I-XI</p>
      <p class="name">Название <button class="switcher"
          @click="nameVariant = nameVariant === 'full' ? 'short' : 'full'">
          {{ nameVariant == 'full' ? 'полн.' : 'сокр.' }}
        </button>
      </p>
    </div>

    <div class="table-container deep-nice-scrollbar" :class="{ 'fast-scroll': isFastScroll }">
      <TableView :data="target" ref="table" backgroundColor="#2a2a2a" :delegate />
    </div>
  </div>
</template>


<script setup lang="ts">
import VehicleType from '../vehicles/type/VehicleType.vue'
import Globe from './assets/globe.svg'
import { computed, ref, triggerRef, watch } from 'vue'
import TableView from '../tableView/TableView.vue'
import { type ComponentInstance } from '@/composition/utils/ComponentInstance'

import { type VehicleLineData, VehicleLine as VehicleLineCell } from './VehicleLine.ts'
import { TableViewDelegate } from '../tableView/tableView/TableView.ts'
import { HeaderLine } from './HeaderLine.ts'
import { FooterLine } from './FooterLine.ts'


const table = ref<ComponentInstance<typeof TableView> | null>(null)

const props = defineProps<{
  displaySections: {
    header: string,
    lines: VehicleLineData[]
  }[]
  game: 'mt' | 'wot'
}>()

const nameVariant = defineModel<'full' | 'short'>('nameVariant')
const selected = defineModel<Set<string>>('selected', { required: true })
const scrollVelocity = ref(0)

const target = computed(() => props.displaySections)

watch(() => target.value.length, () => table.value?.scrollTo({ section: 0, row: 0 }, 'instant'))

const isFastScroll = computed((old) => {
  const velocity = Math.abs(scrollVelocity.value)

  if (old && velocity < 100) return false
  if (!old && velocity >= 1000) return true

  return old
})

function onClick(tag: string) {
  if (selected.value?.has(tag)) selected.value?.delete(tag)
  else selected.value?.add(tag)
  triggerRef(selected)
}


const delegate: TableViewDelegate = {

  onSetupComplete: (table) => {
    table.registerReusable(HeaderLine.reusableKey, () => new HeaderLine())
    table.registerReusable(VehicleLineCell.reusableKey, () => new VehicleLineCell(onClick, selected), 50)
  },

  numberOfSections: () => props.displaySections.length,
  numberOfRowsInSection: (_, section) => props.displaySections[section].lines.length,

  heightForCellByIndex: (_, index) => 35,
  cellForIndex: (table, index) => {
    const cell = table.getReusable<VehicleLineCell>(VehicleLineCell.reusableKey)
    cell.configure(props.displaySections[index.section].lines[index.row], props.game)
    return { cell, reusableKey: VehicleLineCell.reusableKey }
  },

  heightForHeaderInSection: (_, section) => 33,
  headerCellForSection: (table, section) => {
    const cell = table.getReusable<HeaderLine>(HeaderLine.reusableKey)
    cell.setTitle(props.displaySections[section].header)
    return { header: cell, reusableKey: HeaderLine.reusableKey }
  },

  heightForFooterInSection: (_, section) => 20,
  footerCellForSection: (_, section) => {
    const cell = new FooterLine()
    cell.setTitle(`Footer for section ${section}`)
    return cell
  },

  onScrollVelocityChange: (_, velocity) => scrollVelocity.value = velocity
}

</script>


<style lang="scss" scoped>
@use './styles/vehicleLine.scss' as vehicleLine;

.table-header {
  display: flex;
  height: 30px;
  align-items: center;
  margin: 0 -15px 0 -15px;
  padding: 0 15px 0 15px;

  border-bottom: 1px solid #ffffff18;

  .name {
    width: 100%;
    text-align: center;
    position: relative;

    .switcher {
      position: absolute;
      right: 0px;
      top: 4px;
      background-color: rgba(255, 255, 255, 0.1);
      line-height: 1;
      font-size: 0.7em;
      font-weight: bold;
      border-radius: 20px;
      padding: 3px 5px;
      cursor: pointer;
      transition: background-color 0.2s;
      border: none;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .level {
    width: 30px;
    min-width: 30px;
    text-align: center;
  }

  .type {
    width: 40px;
    min-width: 40px;
    display: flex;
    justify-content: center;

    .img {
      fill: white;
      width: 20px;
    }
  }

  .flag {
    display: flex;
    justify-content: center;
    width: 30px;
    min-width: 30px;
    margin-right: 7px;

    .img {
      width: 14px;
    }
  }
}

.table-container {
  width: 340px;
  height: 300px;
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

  @include vehicleLine.vehicleLine;

  .header-line {
    padding: 10px 10px 3px 10px;
    height: 20px;
    z-index: 2;

    background-color: #2a2a2a;
    border-bottom: 1px solid #ffffff18;
    // background: linear-gradient(180deg, #2a2a2a 40%, #2a2a2a53);
    background-color: #fb30be2c;

    h5 {
      margin: 0;
    }
  }

  .footer-line {
    padding: 0 10px 0 10px;
    height: 20px;
    font-size: 14px;
    z-index: 2;

    background-color: #0182fa44;

    p {
      margin: 0;
    }
  }

  .scroll {
    .header-line {
      position: sticky;
      top: 0;
    }

    .footer-line {
      position: sticky;
      bottom: 0;
    }
  }
}
</style>
