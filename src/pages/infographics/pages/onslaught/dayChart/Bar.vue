<template>
  <div class="bar" :class="{
    'selected': props.selected
  }" :style="{
    height: `${props.value * 100}%`
  }">
    <div class="shadow"></div>
    <Transition name="fade">
      <div class="selection-box" v-if="props.selected">
        <div class="line left-line vertical"></div>
        <div class="line right-line vertical"></div>
        <div class="line bottom-line horizontal"></div>
        <div class="line top-line horizontal"></div>
      </div>
    </Transition>


  </div>
</template>


<script setup lang="ts">
const props = defineProps<{
  value: number
  selected?: boolean
}>()
</script>


<style lang="scss" scoped>
.bar {
  width: 22px;
  border-top: 1px solid #e59851;
  background: linear-gradient(-45deg, #ffb86c7e 0%, #ff8c0071 100%);
  position: relative;
  cursor: pointer;

  &:hover {
    background: linear-gradient(-45deg, #ffb86c9e 0%, #ff8c0091 100%);
  }

  &.selected {
    background: linear-gradient(-45deg, #ffb86c9e 0%, #ff8c0091 100%);
  }

  .shadow {
    position: absolute;
    left: 0;
    right: 0;
    top: -30px;
    height: 30px;
    background: linear-gradient(0deg, #ffb86c20 0%, #ffb86c00 100%);
  }

  .selection-box {
    .line {
      position: absolute;
      background: #ffd6a4;
      box-shadow: 0 0 5px #ffac46;
      opacity: 0.8;
    }

    .horizontal {
      left: -40%;
      right: -40%;
      height: 1px;
      border-radius: 100%;
    }

    .vertical {
      top: -20px;
      bottom: 0;
      width: 1px;
      border-top-left-radius: 100%;
      border-top-right-radius: 100%;
    }

    .top-line {
      top: -1px;
    }

    .bottom-line {
      bottom: 0;
      transform: translateY(50%);
    }

    .left-line {
      left: 0;
      transform: translateX(-50%);
    }

    .right-line {
      right: 0;
      transform: translateX(50%);
    }


    &.fade-enter-active,
    &.fade-leave-active {
      transition: opacity 0.5s ease;

      .vertical {
        transition: top 0.2s ease;
      }

      .horizontal {
        transition: opacity 0.2s ease, left 0.2s ease, right 0.2s ease;
      }
    }

    &.fade-enter-from,
    &.fade-leave-to {
      .vertical {
        top: 100%;
      }

      .horizontal {
        opacity: 0;
        left: 50%;
        right: 50%;
      }
    }

  }
}
</style>