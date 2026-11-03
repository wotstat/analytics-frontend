<template>
  <img :src="Background" class="background" alt="">
</template>

<script setup lang="ts">
import Background from './assets/background.webp'
</script>

<style scoped lang="scss">
.background {
  position: absolute;
  transform: translate3d(0, 0, 0);
  left: 0;
  top: 0;
  width: 100%;
  height: 900px;
  object-fit: cover;

  filter: brightness(0.8) blur(30px);
  opacity: 0.3;
  mask-image: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4) 45%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
  user-select: none;
}
</style>
