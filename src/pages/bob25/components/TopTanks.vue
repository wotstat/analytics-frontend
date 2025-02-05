<template>
  <div class="line">
    <h3 v-if="title">{{ title }}</h3>
    <div class="card">
      <div class="blogger" v-for="(_, i) in new Array(4)">
        <div class="top" v-if="!less800">
          <VehicleImage :size="'shop'" :tag="'uk:GB83_FV4005'" />
          <p>{{ getTankName('uk:GB83_FV4005', true) }} (5.4%)</p>
        </div>
        <h4 v-else>{{ bloggerNamesArray[i] }}</h4>
        <div class="more-lines">
          <div class="mini-line" v-for="i in new Array(4)">
            <VehicleImage :size="'small'" :tag="'uk:GB83_FV4005'" />
            <p class="name">{{ getTankName('uk:GB83_FV4005', true) }}</p>
            <p class="right">8.3%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import VehicleImage from '@/components/vehicles/VehicleImage.vue';
import { getTankName } from '@/utils/i18n';
import { useMediaQuery } from '@vueuse/core';
import { bloggerNamesArray } from './bloggerNames';

const less800 = useMediaQuery('(max-width: 800px)')

const props = defineProps<{
  title?: string
}>()
</script>


<style lang="scss" scoped>
h3 {
  margin: 0;
  margin-bottom: 5px;
}

.card {
  display: flex;
  position: relative;

  @media screen and (max-width: 800px) {
    flex-direction: column;
    gap: 20px;
  }

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

    p {
      margin: 0;
      font-weight: bold;
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

      img {
        position: absolute;
        left: 0;
        height: 30px;
        z-index: -1;
      }

      .name {
        margin-left: 60px;
        font-size: 14px;
        flex: 1;
        font-weight: bold;
      }
    }
  }
}
</style>