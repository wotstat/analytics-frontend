<template>
  <div class="item mt-font">
    <div class="normal">
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
    <div class="small">
      <div class="value-line">
        <div class="icon">
          <slot name="icon"></slot>
        </div>
        <div class="value">
          <slot name="value"></slot>
        </div>
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
  container: item / inline-size;

  .icon {
    display: flex;
    align-items: center;
    user-select: none;
    pointer-events: none;
  }

  .value {
    font-size: 24px;
    font-weight: bold;
    line-height: 1;
  }

  .normal {
    display: none;

    @container item (width > 160px) {
      display: contents;
    }

    .icon {
      width: 55px;
      height: 55px;
    }

    .value {
      font-size: 24px;
      font-weight: bold;
      line-height: 1;
    }

    .right {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }

  .small {
    display: none;
    flex-direction: column;

    @container item (width <=160px) {
      display: flex;
    }

    .value-line {
      display: flex;
      align-items: center;

      .icon {
        height: 35px;
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>