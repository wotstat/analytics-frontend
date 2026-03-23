<template>
  <div class="assist-tooltip">
    <div class="line">
      <Icon :icon="'assist-radio'" class="icon" />
      <p>Разведданными: <span class="value mt-font">{{ radio }}</span></p>
    </div>
    <div class="line">
      <Icon :icon="'assist-track'" class="icon" />
      <p>Обездвиженным: <span class="value mt-font">{{ track }}</span></p>
    </div>
    <div class="line">
      <Icon :icon="'stun'" class="icon" />
      <p>Оглушением: <span class="value mt-font">{{ stun }}</span></p>
    </div>
  </div>
</template>


<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'

const props = defineProps<{
  radio: number
  track: number
  stun: number
}>()
</script>


<style lang="scss" scoped>
.assist-tooltip {
  margin-bottom: -5px;
  width: 180px;
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