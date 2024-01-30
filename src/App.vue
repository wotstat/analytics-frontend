<template>
  <div class="app">
    <Header />
    <div class="content">
      <RouterView />
    </div>
  </div>
</template>


<script setup lang="ts">
import { RouterView } from 'vue-router';
import Header from "./components/Header.vue";

const isWindows = navigator.platform.indexOf('Win') > -1
const boldWeight = isWindows ? 700 : 800
const mediumBoldWeight = isWindows ? 500 : 600

</script>


<style scoped>
.content {
  padding-top: 50px;
}
</style>

<style>
.app {
  --bold-weight: v-bind(boldWeight);
  --medium-bold-weight: v-bind(mediumBoldWeight);
}
</style>