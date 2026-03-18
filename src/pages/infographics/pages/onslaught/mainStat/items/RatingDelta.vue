<template>
  <Item>
    <template #icon>
      <RankIcon :rank="{ value: value, eliteRating: eliteRating }" :size="'medium'" :season :game class='icon' />
    </template>
    <template #value>
      <p class="value">{{ value }}</p>
    </template>
    <template #subline>
      <p class="text">
        <span class="semi-transparent">За день </span>
        <span class='delta green' v-if="delta > 0">+{{ delta }}</span>
        <span class='delta red' v-else-if="delta < 0">{{ delta }}</span>
        <span class="delta" v-else>+0</span>
      </p>
    </template>
  </Item>
</template>


<script setup lang="ts">
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import Item from './Item.vue'
import { GameVendor } from '@/shared/game/wot'

const props = defineProps<{
  value: number,
  eliteRating: number
  delta: number
  season?: string
  game?: GameVendor
}>()
</script>


<style lang="scss" scoped>
.icon {
  width: 55px;
  height: 55px;
}

.value {
  margin-left: 8px;
}

.text {
  font-size: 14px;
  line-height: 1.2;
  margin-left: 8px;
  margin-top: 2px;

  .semi-transparent {
    opacity: 0.7;
  }

  .delta {
    font-size: 16px;
    line-height: 0;
  }

  // .green {
  //   color: #ffffff;
  //   filter: drop-shadow(0px 0px 4px #53ff30);
  // }

  // .red {
  //   color: #ffffff;
  //   filter: drop-shadow(0px 0px 4px #ff4157);
  // }

  .green {
    color: #4aff62;
  }

  .red {
    color: #ff6262;
  }
}
</style>