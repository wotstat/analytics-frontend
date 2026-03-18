<template>
  <div class="item mt-font">
    <div class="icon">
      <slot name="icon"></slot>
    </div>
    <div class="right">
      <div class="value">
        <slot name="value"></slot>
      </div>
      <div class="subline">
        <slot name="subline"></slot>
      </div>
    </div>

  </div>
</template>


<script setup lang="ts">
const props = defineProps<{
}>()
</script>


<style lang="scss" scoped>
.item {
  display: flex;

  .icon {
    display: flex;
    align-items: center;
    user-select: none;
    pointer-events: none;
  }

  .right {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .value {
    font-size: 24px;
    font-weight: bold;
    line-height: 1;
  }
}
</style>