<template>
  <span class="dropdown-crossing-arrow" :class="{ 'is-expanded': expanded }">
    <span class="line-left"></span>
    <span class="line-right"></span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  expanded?: boolean
}>(), { expanded: false })
</script>

<style lang="scss" scoped>
.dropdown-crossing-arrow {
  display: inline-block;
  flex: none;
  position: relative;
  width: 20px;
  height: 20px;
  vertical-align: middle;

  .line-left,
  .line-right {
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
      background-color: currentColor;
      border-radius: 10px;
      transition: width 0.2s ease, left 0.2s ease, right 0.2s ease;
    }
  }

  .line-left {
    transform: translate(-57%, 20%) rotate(35deg);

    &::after {
      left: 10%;
    }
  }

  .line-right {
    transform: translate(-43%, 20%) rotate(-35deg);

    &::after {
      right: 10%;
    }
  }

  &.is-expanded {
    .line-left {
      transform: translate(-50%, -50%) rotate(45deg);

      &::after {
        left: 0%;
        width: 100%;
      }
    }

    .line-right {
      transform: translate(-50%, -50%) rotate(-45deg);

      &::after {
        right: 0%;
        width: 100%;
      }
    }
  }
}
</style>
