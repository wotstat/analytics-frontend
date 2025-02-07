<template>
  <h2 class="mt-font" :class="{
    [targetBlogger!]: true,
    'small-bloom': props.smallBloom
  }">{{ targetNickname }}</h2>
</template>


<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  blogger: 'jove' | 'lebwa' | 'nearyou' | 'yusha' | 0 | 1 | 2 | 3 | number
  smallBloom?: boolean
}>()

const targetBlogger = computed(() => {
  if (typeof props.blogger == 'string') return props.blogger
  switch (props.blogger) {
    case 1: return 'jove'
    case 3: return 'lebwa'
    case 0: return 'nearyou'
    case 2: return 'yusha'
  }
})

const targetNickname = computed(() => {
  switch (targetBlogger.value) {
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

  --bloom-radius: 0.3em;

  &.small-bloom {
    --bloom-radius: 0.1em;
  }

  &.jove {
    text-shadow: 0 0 var(--bloom-radius) #ff0000;
  }

  &.lebwa {
    text-shadow: 0 0 calc(var(--bloom-radius) * 1.1) #ffe100;
  }

  &.yusha {
    text-shadow: 0 0 var(--bloom-radius) #009dff;
  }

  &.nearyou {
    text-shadow: 0 0 var(--bloom-radius) #ff00fb;
  }

}
</style>