<template>
  <div class="blogger" :class="blogger">
    <img :src="targetUrl" :alt="blogger">
    <h2 class="mt-font">{{ targetNickname }}</h2>
  </div>
</template>


<script setup lang="ts">

import { computed } from 'vue';
import Jove from './jove.png'
import Lebwa from './lebwa.png'
import Nearyou from './nearyou.png'
import Yusha from './yusha.png'

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

const targetNickname = computed(() => {
  switch (props.blogger) {
    case 'jove': return 'Jove'
    case 'lebwa': return 'LeBwa'
    case 'nearyou': return 'Near_You'
    case 'yusha': return 'Yusha'
  }
})
</script>


<style lang="scss" scoped>
.blogger {
  position: relative;
  z-index: -1;
  margin-bottom: -2%;

  img {
    width: 100%;
    height: auto;
    max-height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;

    mask-image: linear-gradient(rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 90%);
  }

  h2 {
    position: absolute;
    bottom: 30%;
    font-weight: bold;
    text-align: center;
    width: 100%;
    color: white;
    font-size: 2.5em;
    margin: 0;

    @media (max-width: 768px) {
      font-size: 1.5em;
    }
  }

  &.jove {
    h2 {
      text-shadow: 0 0 10px #ff0000;
    }
  }

  &.lebwa {
    h2 {
      text-shadow: 0 0 12px #ffe100;
    }
  }

  &.yusha {
    h2 {
      text-shadow: 0 0 10px #009dff;
      transform: translateX(5%);
    }
  }

  &.nearyou {
    h2 {
      text-shadow: 0 0 10px #ff00fb;
    }
  }
}
</style>