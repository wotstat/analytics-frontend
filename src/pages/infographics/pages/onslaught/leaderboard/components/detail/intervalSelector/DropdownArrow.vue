<template>
  <div class="icon" :class="{ open: isOpen }">
    <div class="l1"></div>
    <div class="l2"></div>
  </div>
</template>


<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
}>()
</script>


<style lang="scss" scoped>
.icon {
  position: relative;
  width: 20px;
  height: 20px;

  .l1,
  .l2 {
    position: absolute;
    height: 2px;
    transition: transform 0.2s ease;
    top: 50%;
    left: 50%;
    width: 100%;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 55%;
      background-color: rgb(255, 255, 255);
      border-radius: 10px;
      transition: width 0.2s ease, left 0.2s ease, right 0.2s ease;
    }
  }

  .l1 {
    transform: translate(-57%, 20%) rotate(35deg);

    &::after {
      left: 10%;
    }
  }

  .l2 {
    transform: translate(-43%, 20%) rotate(-35deg);

    &::after {
      right: 10%;
    }
  }

  &.open {

    .l1 {
      width: 100%;
      transform: translate(-50%, -50%) rotate(45deg);

      &::after {
        left: 0%;
        width: 100%;
      }
    }

    .l2 {
      width: 100%;
      transform: translate(-50%, -50%) rotate(-45deg);

      &::after {
        right: 0%;
        width: 100%;
      }
    }
  }
}
</style>