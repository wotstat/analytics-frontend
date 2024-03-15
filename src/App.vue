<template>
  <div class="app">
    <Header />
    <div class="content">
      <RouterView />
    </div>

    <div class="devmode" v-if="isDevMode">
      <p>В РАЗРАБОТКЕ</p>
    </div>
  </div>
</template>


<script setup lang="ts">
import { RouterView } from 'vue-router';
import Header from "./components/Header.vue";

const isWindows = navigator.platform.indexOf('Win') > -1
const boldWeight = isWindows ? 700 : 800
const mediumBoldWeight = isWindows ? 500 : 600

const isDevMode = import.meta.env.VITE_SHOW_DEV_WATERMARK === 'true';

</script>


<style scoped>
.content {
  padding-top: 57.5px;
}

.devmode {
  position: fixed;
  top: 1rem;
  left: 1rem;
  pointer-events: none;

  font-weight: 700;
  font-size: 2rem;

  background: #523600db;
  border: 2px solid #fedd9c;
  border-radius: 5px;
  padding: 0 10px;

  z-index: 10000;
}
</style>

<style lang="scss">
.app {
  --bold-weight: v-bind(boldWeight);
  --medium-bold-weight: v-bind(mediumBoldWeight);
}
</style>