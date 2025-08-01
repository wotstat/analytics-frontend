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
        <VehicleLine v-for="(vehicle, i) in list" :key="vehicle.index" :nation="vehicle.data.nation"
          :type="vehicle.data.type" :level="vehicle.data.level" :tag="vehicle.data.tag"
          :highlightStrings="vehicle.data.highlightStrings" @click="onClick(vehicle.data.tag)" />
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useThrottle, useVirtualList } from '@vueuse/core'
import VehicleType from '../vehicles/type/VehicleType.vue'
import Globe from "./globe.svg";
import { HighlightedString } from '../highlightString/highlightUtils'
import { computed, shallowRef, toRaw, toValue, triggerRef, watch } from 'vue'
import VehicleLine from './VehicleLine.vue'


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

// const delayedList = shallowRef(list.value)

// function frame() {
//   requestAnimationFrame(frame)
//   // console.log(list.value);

//   // const randomIndex = new Array(50).fill(0).map(() => Math.floor(Math.random() * target.value.length));
//   // delayedList.value = randomIndex.map(index => {
//   //   const item = toRaw(target.value[index])
//   //   return {
//   //     index,
//   //     data: item
//   //   }
//   // })

//   // delayedList.value = list.value.map(item => toRaw(item))
//   // console.log(delayedList.value);

// }
// frame()


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
}
</style>
