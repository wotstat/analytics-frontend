<template>
  <div class="center-container">
    <img :src="Background" class="background" alt="background" />
    <h1>Битва Блогеров 2025</h1>

    <div class="card">

      <p class="card-main-info description">Очки</p>
    </div>

  </div>
</template>


<script setup lang="ts">
import Background from "./background.webp";

</script>


<style lang="scss" scoped>
h1 {
  color: white;
  text-shadow:
    0.5px 0.3px 8px rgba(0, 195, 255, 0.3),
    -0.5px -0.5px 8px rgba(225, 0, 255, 0.3),
    0.5px 0.5px 3px rgb(0, 195, 255, 0.6),
    -0.5px -0.3px 3px rgb(225, 0, 255, 0.6);
}

.background {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  z-index: -1;

  filter: brightness(0.8) blur(30px);
  opacity: 0.4;
  mask-image: linear-gradient(rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.5) 10%, rgba(0, 0, 0, 0.25) 20%, rgba(0, 0, 0, 0) 60%);
  pointer-events: none;
  user-select: none;
}
</style>