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
      <ReusableTable :data="target" ref="reusableTable" backgroundColor="#2a2a2a"
        :options="{ height: 35, cellConstructor: createCell }">
        <template v-slot="{ data, index }">
          <VehicleLine :nation="data.nation" :type="data.type" :level="data.level" :tag="data.tag"
            :highlightStrings="data.highlightStrings" @click="onClick(data.tag)"
            :class="{ selected: selected?.has(data.tag) }" />
        </template>
      </ReusableTable>
    </div>
  </div>
</template>


<script setup lang="ts">
import VehicleType from '../vehicles/type/VehicleType.vue'
import Globe from './assets/globe.svg'
import { HighlightedString } from '../highlightString/highlightUtils'
import { computed, onMounted, ref, triggerRef, watch } from 'vue'
import VehicleLine from './VehicleLine.vue'
import { STATIC_URL } from '@/utils/externalUrl'
import ReusableTable from '../reusableTable/ReusableTable.vue'
import { type ComponentInstance } from '@/composition/utils/ComponentInstance'

import { type VehicleLineData, VehicleLine as VehicleLineCell } from './VehicleLine.ts'
import { vehicleUrl } from '../vehicles/vehicle/utils.ts'


const reusableTable = ref<ComponentInstance<typeof ReusableTable<VehicleLineData>> | null>(null)

const props = defineProps<{
  tankToDisplay: VehicleLineData[]
}>()

const nameVariant = defineModel<'full' | 'short'>('nameVariant')
const selected = defineModel<Set<string>>('selected', { required: true })

const target = computed(() => props.tankToDisplay)

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

function createCell() {
  return new VehicleLineCell(onClick, selected)
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

  :deep(.scroll) {
    padding-bottom: 10px;
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

        &.atlas-0 {
          background-image: url('./assets/atlas_0.webp');
        }

        &.atlas-1 {
          background-image: url('./assets/atlas_1.webp');
        }

        &.atlas-2 {
          background-image: url('./assets/atlas_2.webp');
        }

        &.atlas-3 {
          background-image: url('./assets/atlas_3.webp');
        }

        &.atlas-4 {
          background-image: url('./assets/atlas_4.webp');
        }
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
}
</style>
