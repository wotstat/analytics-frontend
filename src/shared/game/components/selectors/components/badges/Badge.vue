<template>
  <div class="badge" @auxclick="handleClose">
    <p class="text">{{ text }}</p>
    <button class="close" @click="handleClose" v-if="props.closable">
      <XIcon class="x-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">

import XIcon from '@/assets/icons/x.svg'

const props = defineProps<{
  text: string
  closable?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
}

</script>

<style scoped lang="scss">
.badge {
  --close-width: 24px;

  position: relative;
  overflow: hidden;
  padding: 3px 5px;
  width: fit-content;
  min-width: 24px;
  max-width: 100%;
  height: 24px;
  box-sizing: border-box;
  border-radius: 5px;

  color: rgba(255, 255, 255, 0.95);
  background-color: rgba(255, 255, 255, 0.1);
  line-height: 1;
  font-size: 14px;
  display: flex;
  align-items: center;

  .text {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
  }

  .close {
    flex: none;
    width: var(--close-width);
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    color: rgba(255, 255, 255, 0.85);

    .x-icon {
      fill: currentColor;
      width: 12px;
      height: 12px;
      display: block;
    }
  }

  @media (hover: hover) {
    &:has(.close) .text {
      // В покое полупрозрачная часть маски находится за краем текста.
      mask-image: linear-gradient(to right, #000 calc(100% - var(--close-width) + 2px), transparent calc(100% - 13px));
      mask-size: calc(100% + var(--close-width)) 100%;
      mask-position: left center;
      mask-repeat: no-repeat;
      transition: mask-position 0.18s ease;
    }

    .close {
      position: absolute;
      top: 0;
      right: 0;
      padding-left: 2px;
      opacity: 0;
      transform: translateX(100%);
      pointer-events: none;
      transition: transform 0.18s ease, opacity 0.18s ease, color 0.15s;

      &:hover {
        color: white;
      }
    }

    &:hover,
    &:focus-within {
      &:has(.close) .text {
        mask-position: right center;
      }

      .close {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }
    }
  }

  @media (hover: none) {
    &:has(.close) {
      padding-right: 0;
    }

    .close {
      padding-right: 2px;
    }
  }

}
</style>
