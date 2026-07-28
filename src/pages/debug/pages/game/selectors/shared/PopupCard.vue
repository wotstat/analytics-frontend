<template>
  <div class="popup-card">
    <slot></slot>
  </div>
</template>


<script setup lang="ts">

</script>


<style scoped lang="scss">
.popup-card {
  background-color: #2a2a2a;
  border: 1px solid #444;
  border-radius: 10px;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
  color: #f6f6f6;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
}
</style>
