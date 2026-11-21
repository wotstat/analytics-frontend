<template>
  <div class="blogger" :class="blogger">
    <img :src="targetUrl" :alt="blogger">
    <h3 class="mt-font" :class="props.blogger">{{ place }}</h3>
    <BloggerName :blogger="blogger" class="nickname" />
    <!-- <h2 class="mt-font">{{ targetNickname }}</h2> -->
  </div>
</template>


<script setup lang="ts">

import { computed } from 'vue'
import Jove from './jove.webp'
import Lebwa from './lebwa.webp'
import Nearyou from './nearyou.webp'
import Yusha from './yusha.webp'
import BloggerName from './BloggerName.vue'


const props = defineProps<{
  blogger: 'jove' | 'lebwa' | 'nearyou' | 'yusha'
}>()

const targetUrl = computed(() => {
  switch (props.blogger) {
    case 'jove': return Jove
    case 'lebwa': return Lebwa
    case 'nearyou': return Nearyou
    case 'yusha': return Yusha
  }
})

const place = computed(() => {
  switch (props.blogger) {
    case 'jove': return '3'
    case 'lebwa': return '2'
    case 'nearyou': return '1'
    case 'yusha': return '4'
  }
})
</script>


<style lang="scss" scoped>
.blogger {
  position: relative;
  z-index: -1;

  img {
    width: 100%;
    height: auto;
    max-height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
    display: block;

    mask-image: linear-gradient(rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.1) 90%, rgba(0, 0, 0, 0) 98%);
    transform: translateY(2%);
  }

  .nickname {
    position: absolute;
    bottom: 22%;
    font-weight: bold;
    text-align: center;
    width: 100%;
    color: white;
    font-size: clamp(16px, 4cqw, 40px);
    margin: 0;
  }

  h3 {
    position: absolute;
    bottom: 30%;
    margin: 0;
    text-align: center;
    line-height: 1;
    width: 100%;
    color: transparent;
    -webkit-text-stroke-color: rgb(255, 255, 255);
    -webkit-text-stroke-width: 2px;
    font-weight: bold;
    font-size: min(20cqw, 170px);

    user-select: none;

    @container content (max-width: 768px) {
      -webkit-text-stroke-width: 1.5px;
    }

    &.jove {
      filter: drop-shadow(0 0 0.3905rem #e01a1b) drop-shadow(0 0 0.3905rem #e01a1b) drop-shadow(0 0 2.18675rem #e01a1b) drop-shadow(0 0 1.1715rem #d50c4f);
    }

    &.lebwa {
      filter: drop-shadow(0 0 0.3905rem #f58f23) drop-shadow(0 0 0.3905rem #f58f23) drop-shadow(0 0 2.18675rem #f58f23) drop-shadow(0 0 1.1715rem #f58f23);
    }

    &.yusha {
      filter: drop-shadow(0 0 0.3905rem #1b99e5) drop-shadow(0 0 0.3905rem #1b99e5) drop-shadow(0 0 2.18675rem #1b99e5) drop-shadow(0 0 1.1715rem #1b99e5);
    }

    &.nearyou {
      filter: drop-shadow(0 0 0.3905rem #d50cd5) drop-shadow(0 0 0.3905rem #d50cd5) drop-shadow(0 0 2.18675rem #d50cd5) drop-shadow(0 0 1.1715rem #d50cd5);
    }
  }

  &.yusha img {
    transform: translateY(2%) scaleX(-1);
  }
}
</style>
