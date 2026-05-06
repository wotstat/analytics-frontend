<template>
  <div class="winrate-tooltip">
    <div class="line win">
      <Icon :icon="'battles'" class="icon" />
      <p>Побед: <span class="value mt-font">{{ win }}</span></p>
    </div>
    <div class="line lose">
      <Icon :icon="'battles'" class="icon" />
      <p>Поражений: <span class="value mt-font">{{ lose }}</span></p>
    </div>
    <div class="line unknown" v-if="unknown > 0">
      <Icon :icon="'battles'" class="icon" />
      <p>Неизвестно: <span class="value mt-font">{{ unknown }}</span></p>
    </div>
  </div>
</template>


<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'


const props = defineProps<{
  lose: number
  win: number
  unknown: number
}>()
</script>


<style lang="scss" scoped>
.winrate-tooltip {
  margin-bottom: -5px;
  width: 130px;
}

.line {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;

  .icon {
    height: 30px;
    margin: -10px;
    margin-right: -7px;
  }

  &.win {

    .icon,
    .value {
      color: #4aff62;
    }
  }

  &.lose {

    .icon,
    .value {
      color: #ff6262;
    }
  }

  &.unknown {

    .icon,
    .value {
      color: #9b9b9b;
    }
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.3;
    flex: 1;
  }

  .value {
    font-weight: bold;
    font-size: 15px;
    line-height: 1;
  }
}
</style>