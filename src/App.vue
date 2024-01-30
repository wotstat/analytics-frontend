<template>
  <Header />
  <div class="content">
    <RouterView />
  </div>
</template>


<script setup lang="ts">
import { RouterView } from 'vue-router';
import Header from "./components/Header.vue";

</script>


<style scoped>
.content {
  padding-top: 50px;
}
</style>
