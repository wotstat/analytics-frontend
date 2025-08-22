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
      <ReusableTable :data="target" ref="reusableTable" backgroundColor="#2a2a2a" :delegate />
    </div>
  </div>
</template>


<script setup lang="ts">
import VehicleType from '../vehicles/type/VehicleType.vue'
import Globe from './assets/globe.svg'
import { computed, ref, triggerRef, watch } from 'vue'
import VehicleLine from './VehicleLine.vue'
import ReusableTable from '../reusableTable/ReusableTable2.vue'
import { type ComponentInstance } from '@/composition/utils/ComponentInstance'

import { type VehicleLineData, VehicleLine as VehicleLineCell } from './VehicleLine.ts'
import { ReusableTableDelegate } from '../reusableTable/ReusableTable.ts'
import { HeaderLine } from './HeaderLine.ts'
import { FooterLine } from './FooterLine.ts'


const reusableTable = ref<ComponentInstance<typeof ReusableTable<VehicleLineData>> | null>(null)

const props = defineProps<{
  displaySections: {
    header: string,
    lines: VehicleLineData[]
  }[]
}>()

const nameVariant = defineModel<'full' | 'short'>('nameVariant')
const selected = defineModel<Set<string>>('selected', { required: true })

const target = computed(() => props.displaySections)

watch(() => target.value.length, () => reusableTable.value?.scrollTo(0))

const isFastScroll = computed((old) => {
  if (!reusableTable.value) return false

  const velocity = Math.abs(reusableTable.value.scrollVelocity)

  if (old && velocity < 300) return false
  if (!old && velocity >= 1000) return true

  return old
})

function onClick(tag: string) {
  if (selected.value?.has(tag)) selected.value?.delete(tag)
  else selected.value?.add(tag)


  triggerRef(selected)
}


const delegate: ReusableTableDelegate = {
  numberOfSections: () => props.displaySections.length,
  numberOfRowsInSection: (_, section) => props.displaySections[section].lines.length,

  heightForCellByIndex: (_, index) => 35,
  cellForIndex: (_, index) => {
    const cell = new VehicleLineCell(onClick, selected)
    cell.configure(props.displaySections[index.section].lines[index.row])
    return cell
  },

  heightForHeaderInSection: (_, section) => 33,
  headerCellForSection: (_, section) => {
    const cell = new HeaderLine()
    cell.setTitle(props.displaySections[section].header)
    return cell
  },

  heightForFooterInSection: (_, section) => 20,
  footerCellForSection: (_, section) => {
    const cell = new FooterLine()
    cell.setTitle(`Footer for section ${section}`)
    return cell
  },
}

</script>


<style lang="scss" scoped>
.table-header,
.line {
  .flag {
    width: 30px;
    min-width: 30px;
    margin-right: 7px;
  }

  .type {
    width: 40px;
    min-width: 40px;
  }

  .level {
    width: 30px;
    min-width: 30px;
  }
}

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
    text-align: center;
  }

  .type {
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
  contain: paint layout style;
  user-select: none;

  :deep(.scroll) {
    // padding-bottom: 10px;
    box-sizing: border-box;
  }
}

.table-container.fast-scroll {
  .line:not(.selected) {
    &::before {
      opacity: 0;
    }
  }
}

:deep(.table-container) {
  .line {
    .flag {
      width: 30px;
      height: 20px;
      min-width: 30px;
      margin-right: 7px;
      background-size: 128px;
      background-repeat: no-repeat;
    }

    .type {
      width: 40px;
      min-width: 40px;
    }

    .level {
      width: 30px;
      min-width: 30px;
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

    &::before {
      content: '';
      position: absolute;
      inset: 0 0px 0 0px;
      border-radius: 6px;
      z-index: -1;
    }

    &:hover {
      &::before {
        background-color: rgba(255, 255, 255, 0.1)
      }
    }


    &.selected {
      &::before {
        background-color: var(--blue-color);
        background: linear-gradient(90deg, #0182fada, #0182fa44 20%, #0182fa2c 50%, transparent);
      }
    }


    .type {
      display: flex;
      justify-content: center;

      color: white;
      fill: currentColor;

      svg {
        width: 14px;
      }
    }

    .flag {
      user-select: none;
      pointer-events: none;
    }

    .level {
      text-align: center;
    }

    .name {
      display: flex;
      align-items: center;
      justify-content: left;
      overflow: hidden;
      flex: 1;

      .tank {
        width: 120px;
        min-width: 120px;
        height: 31px;
        user-select: none;
        pointer-events: none;
        background-repeat: no-repeat;
      }

      p {
        margin-left: -60px;
        text-overflow: ellipsis;
        overflow: hidden;
        font-weight: bold;
        font-size: 0.8em;
      }
    }
  }

  .name {
    .highlight {
      color: var(--blue-thin-color);
    }
  }

  .header-line {
    padding: 10px 10px 3px 10px;
    height: 20px;
    position: sticky;
    top: 0;
    z-index: -1;

    background-color: #9a01fa44;

    h5 {
      margin: 0;
    }
  }

  .footer-line {
    padding: 0 10px 0 10px;
    height: 20px;
    font-size: 14px;
    position: sticky;
    bottom: 0;
    z-index: 1;

    background-color: #0182fa44;

    p {
      margin: 0;
    }
  }
}
</style>
