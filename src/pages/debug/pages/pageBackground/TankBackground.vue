<template>
  <div class="tank-background">
    <div class="glow"></div>
    <TankIcon class="tank" />
  </div>
</template>

<script setup lang="ts">
import TankIcon from '@/shared/game/efficiencyIcon/assets/tank.svg'
</script>

<style scoped lang="scss">
.tank-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: radial-gradient(circle at 80% 70%, #6889a050, transparent 50%), #1a2533;
}

.glow {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, #b8d8ed38, transparent 65%);
}

.tank {
  position: absolute;
  right: 6vw;
  bottom: 9vh;
  width: min(46vw, 600px);
  height: auto;
  color: #bfd7e8;
  opacity: 0.28;
  filter: drop-shadow(0 20px 50px #0008);
}

.page-background-enter-active .tank {
  transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
}

.page-background-enter-from .tank {
  transform: translateX(70vw);
}

.page-background-leave-active .tank {
  transition: transform 500ms ease-in;
}

.page-background-leave-to .tank {
  transform: translateX(-45vw);
}
</style>
