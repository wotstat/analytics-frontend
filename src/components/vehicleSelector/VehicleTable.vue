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
      <ReusableTable :data="target" ref="reusableTable" backgroundColor="#2a2a2a" :options="{ height: 35 }">
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
import Globe from "./assets/globe.svg";
import { HighlightedString } from '../highlightString/highlightUtils'
import { computed, onMounted, ref, triggerRef, watch } from 'vue'
import VehicleLine from './VehicleLine.vue'
import { STATIC_URL } from '@/utils/externalUrl';
import ReusableTable from '../reusableTable/ReusableTable.vue';
import { type ComponentInstance } from '@/composition/utils/ComponentInstance'

type Line = {
  tag: string;
  level: number;
  nation: string;
  type: "MT" | "LT" | "HT" | "AT" | "SPG";
  short: string;
  highlightStrings: HighlightedString;
}


const reusableTable = ref<ComponentInstance<typeof ReusableTable<Line>> | null>(null)

const props = defineProps<{
  tankToDisplay: Line[]
}>()

const nameVariant = defineModel<'full' | 'short'>('nameVariant')
const selected = defineModel<Set<string>>('selected')

const target = computed(() => props.tankToDisplay)

watch(() => target.value.length, () => reusableTable.value?.scrollTo(0))

const isFastScroll = computed((old) => {
  if (!reusableTable.value) return false;

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


const cacheMap = new Map<string, HTMLImageElement>()

// onMounted(() => {
//   const images = target.value
//     .map(t => t.tag.split(':')[1].toLowerCase())
//     .map(t => `${STATIC_URL}/mt/latest/vehicles/small/${t}.webp`)

//   for (const image of images) {
//     const img = new Image()
//     img.src = image
//     img.decode().then(() => {
//       cacheMap.set(image, img)
//     }).catch(() => {
//       console.warn(`Failed to load image: ${image}`)
//     })
//   }
// })

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
</style>
