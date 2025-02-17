<template>
  <div class="line">
    <div class="flex header">
      <h3 class="flex-1">Топы по урону</h3>
      <button class="more-button" @click="isMore = !isMore">{{ isMore ? 'Меньше' : 'Больше' }}</button>
    </div>
    <div class="card">
      <div class="bloggers">
        <div class="blogger" v-for="(blog, i) in [nearyou, lebwa, jove, yusha]">
          <h4>{{ bloggerNamesArray[i] }}</h4>
          <div class="line mt-font" v-for="(player, order) in blog.slice(0, !isMore ? 10 : blog.length)">
            <p class="order">{{ order + 1 }}</p>
            <VehicleImage :tag="player[2]" :size="'small'" />
            <a class="name" :href="`https://tanki.su/ru/community/accounts/${player[1]}-${player[0]}`" target="_blank">
              {{ player[0] }}
            </a>
            <p class="score">{{ player[3] }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">

import { useMediaQuery } from '@vueuse/core';
import { jove, lebwa, yusha, nearyou } from '../assets/top-by-level'
import { ref } from 'vue';
import VehicleImage from '@/components/vehicles/VehicleImage.vue';
import { bloggerNamesArray } from './bloggerNames';
const isMore = ref(false)


</script>


<style lang="scss" scoped>
h3 {
  margin: 0;
  margin-bottom: 5px;
}

.header {
  align-items: baseline;
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

.bloggers {
  display: flex;
  gap: 20px;

  .blogger {
    flex: 1;
  }

  h4 {
    display: none;
    margin: 0 0 10px 0;
    text-align: center;
  }

  @media screen and (max-width: 1000px) {
    flex-direction: column;
    gap: 20px;

    h4 {
      display: block;
    }
  }

  .line {
    display: flex;
    align-items: center;
    padding: 0 5px 0 0;
    overflow: hidden;

    img {
      width: 100px;
      user-select: none;
      pointer-events: none;
    }

    .name {
      margin-left: -40px;
      color: inherit;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 120px;

      &:hover {
        color: #1ea1ff;
      }
    }

    .order {
      font-size: 14px;
      color: #ffffff73;
      margin-bottom: -3px;
      margin-left: 2px;
      margin-right: -5px;
      width: 10px;
    }

    .score {
      flex: 1;
      text-align: right;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
    }
  }
}
</style>