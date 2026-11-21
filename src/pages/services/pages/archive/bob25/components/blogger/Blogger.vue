<template>
  <div class="blogger" :class="blogger">
    <img :src="targetUrl" :alt="blogger">
    <BloggerPlace :blogger />
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
import BloggerPlace from './BloggerPlace.vue'


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

  .place {
    font-size: min(20cqw, 170px);

    @container content (max-width: 768px) {
      -webkit-text-stroke-width: 1.5px;
    }
  }

  &.yusha img {
    transform: translateY(2%) scaleX(-1);
  }
}
</style>
