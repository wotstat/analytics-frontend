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
    <div class="card multi-value mono-num">
      <div class="flex">
        <WideValues :values="playersCount" space colorize />
      </div>
      <div class="flex subline">
        <WideValues :values="playersCountPercent" colorize :processor="t => `${t.toFixed(2)}%`" />
      </div>
    </div>

    <br>

    <h3>Всего очков</h3>
    <div class="card multi-value mono-num">
      <div class="flex">
        <WideValues :values="playersCount" space colorize />
      </div>
      <div class="flex subline">
        <WideValues :values="playersCountPercent" :precision="2" colorize :processor="t => `${t.toFixed(2)}%`" />
      </div>
    </div>

  </div>
</template>


<script setup lang="ts">
import Background from "./assets/background.webp";
import Blogger from "./components/blogger/Blogger.vue";
import WideValues from "./components/WideValues.vue";
import { computed } from "vue";
import { useTimestamp } from "@vueuse/core";


const time = useTimestamp();
const offset = computed(() => Math.round((time.value - 1738373302152) / 3000));
const playersCount = computed(() => [
  100 + offset.value * 400 * Math.random(),
  200 + offset.value * 400 * Math.random(),
  300 + offset.value * 400 * Math.random(),
  400 + offset.value * 400 * Math.random(),]
);

const playersCountPercent = computed(() => playersCount.value.map(v => 100 * v / playersCount.value.reduce((a, v) => a + v, 0)));



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

h3 {
  margin: 0;
  margin-bottom: 5px;
}

.card {
  background: rgba(255, 255, 255, 0.08);
}

.multi-value {
  font-size: 1.5rem;
  color: white;
  font-size: 28px;
  text-align: center;
  font-weight: bold;
  line-height: 1;

  :deep(p) {
    flex: 1;
  }

  .subline {
    margin-top: 8px;
    font-size: 15px;
    opacity: 0.8;
  }
}
</style>