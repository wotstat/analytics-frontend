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

    <div class="table-container nice-scrollbar" v-bind="containerProps">
      <div class="wrapper" v-bind="wrapperProps">
        <div class="line" :class="selected?.has(vehicle.data.tag) ? 'selected' : ''" v-for="vehicle in list"
          :key="vehicle.index" @click="onClick(vehicle.data.tag)">
          <Nation :nation="vehicle.data.nation" class="flag" />
          <div class="type">
            <VehicleType :type="vehicle.data.type" class="icon" />
          </div>
          <VehicleLevel :level="vehicle.data.level" class="level" />
          <p class="name">
            <VehicleImage :tag="vehicle.data.tag" :size="'small'" class="tank" />
            <Highlight :text="vehicle.data.highlightStrings" />
          </p>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import Highlight from '../highlightString/index.vue'
import Nation from '../vehicles/nation/Nation.vue'
import VehicleImage from '../vehicles/VehicleImage.vue'
import { useVirtualList } from '@vueuse/core'
import VehicleType from '../vehicles/type/VehicleType.vue'
import VehicleLevel from '../vehicles/VehicleLevel.vue'
import Globe from "./globe.svg";
import { HighlightedString } from '../highlightString/highlightUtils'
import { computed, triggerRef, watch } from 'vue'

const props = defineProps<{
  tankToDisplay: {
    tag: string;
    level: number;
    nation: string;
    type: "MT" | "LT" | "HT" | "AT" | "SPG";
    short: string;
    highlightStrings: HighlightedString;
  }[]
}>()

const nameVariant = defineModel<'full' | 'short'>('nameVariant')
const selected = defineModel<Set<string>>('selected')

const target = computed(() => props.tankToDisplay)

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(target, {
  itemHeight: 35,
  overscan: 10,
})

watch(() => target.value.length, () => scrollTo(0))

function onClick(tag: string) {
  if (selected.value?.has(tag)) selected.value?.delete(tag)
  else selected.value?.add(tag)


  triggerRef(selected)
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
  overflow-y: auto;
  overflow-x: visible;
  width: 340px;
  height: 300px;
  position: relative;
  padding-right: 3.5px;
  padding-bottom: 10px;
  margin-right: -11.5px;
  margin-left: -10px;
  padding-left: 10px;

  .line {
    display: flex;
    white-space: nowrap;
    height: 34px;
    align-items: center;
    border-top: 1px solid #d0d0d008;
    position: relative;
    cursor: pointer;

    &::before {
      content: '';
      position: absolute;
      inset: 0 -3px 0 -7px;
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

      .icon {
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
        user-select: none;
        pointer-events: none;
      }

      p {
        width: 100%;
        margin-left: -60px;
        text-overflow: ellipsis;
        overflow: hidden;
        font-weight: bold;
        font-size: 0.8em;
      }
    }
  }

  :deep(.highlight) {
    color: var(--blue-thin-color);
  }
}
</style>
