<template>
  <div class="line">
    <div class="flex header">
      <h3 v-if="title" class="flex-1">{{ title }}</h3>
      <button class="more-button" @click="isMore = !isMore">{{ isMore ? 'Меньше' : 'Больше' }}</button>
    </div>
    <div class="card">
      <div class="columns">
        <div class="blogger" v-for="(t, i) in data">
          <div class="top" v-if="!less800">
            <VehicleImage :size="'shop'" :tag="t[0].tag" />
            <p class="mt-font" :class="t[0].tag == selected ? 'selected' : ''">{{ getTankName(t[0].tag, true) }} ({{
              format(t[0].value) }}<img class="crown" :src="Crown" v-if="valueType == 'score'">)
            </p>
          </div>
          <h4 v-else>{{ bloggerNamesArray[i] }}</h4>
          <div class="more-lines">
            <div class="mini-line" :class="line.tag == selected ? 'selected' : ''" @pointerover="hover(line.tag)"
              @pointerout="unhover(line.tag)"
              v-for="(line, i) in less800 ? t.slice(0, isMore ? t.length : 5) : t.slice(1).slice(0, isMore ? t.length : 5)">
              <VehicleImage :size="'small'" :tag="line.tag" />
              <p class="name mt-font">{{ getTankName(line.tag, true) }}</p>
              <p class="right mt-font bold">{{ format(line.value) }}<img class="crown" :src="Crown"
                  v-if="valueType == 'score'">
              </p>
            </div>
          </div>
        </div>
      </div>
      <slot></slot>
    </div>
  </div>
</template>


<script setup lang="ts">
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import { getTankName } from '@/shared/i18n/i18n'
import { useMediaQuery } from '@vueuse/core'
import { bloggerNamesArray } from './bloggerNames'
import { createPercentProcessor } from '@/shared/utils/processors/processors'
import Crown from '../assets/crown.png'
import { ref } from 'vue'

const less800 = useMediaQuery('(max-width: 800px)')
const isMore = ref(false)
const selected = ref('')

const percent = createPercentProcessor(2)

const props = defineProps<{
  title?: string
  data: {
    tag: string
    value: number
  }[][]
  valueType?: 'percent' | 'score'
}>()


function format(value: number) {
  if (props.valueType == 'percent') return percent(value)
  return value.toFixed(2)
}


function hover(tag: string) {
  selected.value = tag
}

function unhover(tag: string) {
  if (selected.value == tag) selected.value = ''
}

</script>


<style lang="scss" scoped>
h3 {
  margin: 0;
  margin-bottom: 5px;
}

.header {
  align-items: baseline;
}

.card {
  .columns {
    display: flex;
    position: relative;

    @media screen and (max-width: 800px) {
      flex-direction: column;
      gap: 20px;
    }
  }
}

.more-button {
  background: none;
  border: none;
  color: #1ea1ff;
  cursor: pointer;
  font-size: 14px;
  margin: 0;
  padding: 0;
  margin-left: 10px;
}

.blogger {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;


  h4 {
    line-height: 1;
    margin: 0 0 10px 0;
  }

  .top {
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-top: -2vw;

    @media screen and (min-width: 1200px) {
      margin-top: -23px;
    }

    img {
      min-width: 0;
      width: 100%;
      max-width: 200px;
      user-select: none;
      pointer-events: none;
    }

    .crown {
      position: unset;
      display: inline-block;
      height: 15px;
      width: auto;
      margin-bottom: -1.5px;
      margin-right: 2px;
      margin-left: 3px;
    }

    p {
      margin: 0;
      font-weight: bold;
      position: relative;

      &::before {
        content: '';
        background: #ffffff00;
        position: absolute;
        inset: -2px -10px;
        border-radius: 5px;
        z-index: -2;
        transition: background 0.1s;
      }

      &.selected {
        &::before {
          background: #ffffff2b;
        }
      }
    }
  }

  .more-lines {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1px;
    align-items: center;

    .mini-line {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 15px;
      position: relative;
      height: 30px;
      margin: 0;
      width: 100%;
      max-width: 230px;

      &::before {
        content: '';
        background: #ffffff00;
        position: absolute;
        inset: 0 -8px 0 0;
        border-radius: 5px;
        z-index: -2;
        transition: background 0.1s;
      }

      &.selected::before {
        background: #ffffff2b;
      }


      @media screen and (max-width: 800px) {
        max-width: unset;
      }

      img {
        position: absolute;
        left: 0;
        height: 30px;
        pointer-events: none;
        user-select: none;
      }

      .name {
        margin-left: 60px;
        font-size: 14px;
        flex: 1;
        font-weight: bold;
        z-index: 1;
      }

      .crown {
        position: unset;
        display: inline-block;
        height: 15px;
        margin-bottom: -1px;
        margin-left: 3px;
      }
    }
  }
}
</style>