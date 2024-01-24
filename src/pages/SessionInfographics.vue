<template>
  <div>
    <h1>Сессионная инфографика</h1>
    <div class="card">
      <ShotsCircle />
    </div>
  </div>
</template>

<script setup lang="ts">
import ShotsCircle from "@/components/widgets/ShotsCircle.vue";

</script>

<style lang="scss" scoped>
.card {
  padding: 40px;
}
</style>