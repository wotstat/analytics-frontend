<template>
  <div class="center-container">
    <img :src="Background" class="background" alt="background" />
    <h1>Битва Блогеров 2025</h1>

    <div class="bloggers">
      <Blogger blogger="nearyou" />
      <Blogger blogger="jove" />
      <Blogger blogger="yusha" />
      <Blogger blogger="lebwa" />
    </div>

    <h3>Всего игроков</h3>
    <div class="card multi-value">
      <p>232523</p>
      <p>123584</p>
      <p>98510</p>
      <p>87405</p>
    </div>

  </div>
</template>


<script setup lang="ts">
import { useFixedSpaceProcessor } from "@/composition/usePercentProcessor";
import Background from "./assets/background.webp";
import Blogger from "./components/Blogger.vue";

// useFixedSpaceProcessor(0);

</script>


<style lang="scss" scoped>
h1 {
  color: white;
  text-align: center;
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
  height: 900px;
  object-fit: cover;
  z-index: -1;

  filter: brightness(0.8) blur(30px);
  opacity: 0.3;
  mask-image: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4) 45%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
  user-select: none;
}

.bloggers {
  display: flex;
  justify-content: space-around;
  max-width: 100%;
  max-height: 400px;
  padding: 0 15px;
}

.card {
  background: rgba(255, 255, 255, 0.08);
}

.multi-value {
  display: flex;
  justify-content: space-around;
  font-size: 1.5rem;
  color: white;
}
</style>