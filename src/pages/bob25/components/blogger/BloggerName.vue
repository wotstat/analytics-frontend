<template>
  <h2 class="mt-font" :class="blogger">{{ targetNickname }}</h2>
</template>


<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  blogger: 'jove' | 'lebwa' | 'nearyou' | 'yusha'
}>()

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
h2 {
  color: white;

  &.jove {
    text-shadow: 0 0 0.3em #ff0000;
  }

  &.lebwa {
    text-shadow: 0 0 0.35em #ffe100;
  }

  &.yusha {
    text-shadow: 0 0 0.3em #009dff;
  }

  &.nearyou {
    text-shadow: 0 0 0.3em #ff00fb;
  }
}
</style>