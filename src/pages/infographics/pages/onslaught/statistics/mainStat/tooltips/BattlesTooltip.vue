<template>
  <div class="battles-tooltip">
    <div class="line">
      <Icon :icon="'solo'" class="icon" />
      <p>Соло: <span class="value mt-font">{{ solo }}</span></p>
    </div>
    <div class="line">
      <Icon :icon="'platoon'" class="icon" />
      <p>Взвод: <span class="value mt-font">{{ squad }}</span></p>
    </div>
  </div>
</template>


<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'

const props = defineProps<{
  solo: number
  squad: number
}>()
</script>


<style lang="scss" scoped>
.battles-tooltip {
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