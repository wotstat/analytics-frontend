<template>
  <div class="loading-page">
    <Loader />
  </div>
</template>


<script setup lang="ts">
import Loader from '../loader/Loader.vue'
</script>


<style lang="scss" scoped>
.loading-page {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>