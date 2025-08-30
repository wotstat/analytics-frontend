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
      <TableView ref="table" :delegate />
    </div>
  </div>
</template>


<script setup lang="ts">
import VehicleType from '@/components/vehicles/type/VehicleType.vue'
import Globe from './assets/globe.svg'
import { computed, ref, triggerRef, watch } from 'vue'
import TableView from '@/uiKit/tableView/TableView.vue'
import { type ComponentInstance } from '@/composition/utils/ComponentInstance'

import { type VehicleLineData, VehicleLine as VehicleLineCell } from './VehicleLine.ts'
import { TableViewDelegate } from '@/uiKit/tableView/tableView/TableView.ts'
import { HeaderLine } from '@/uiKit/tableView/tableView/default/HeaderLine.ts'


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

watch(() => target.value, (value, old) => {
  table.value?.dataDidUpdate()
  if (old.length != value.length || old.some((section, index) => section.lines.length != value[index].lines.length)) {
    table.value?.scrollTo({ section: 0, row: 0 }, 'instant')
  }
})

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

  heightForFooterInSection: (_, section) => section == props.displaySections.length - 1 ? 10 : 15,

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

  --background-color: #2a2a2a;
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
    background-color: var(--background-color);
    border-bottom: 1px solid #ffffff18;
    padding: 10px 7px 3px 7px;
    margin: 0 3px;
    position: sticky;
    top: 0;

    h5 {
      margin: 0;
    }
  }
}
</style>
