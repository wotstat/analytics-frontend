<template>
  <div class="badge" @auxclick="handleClose">
    <p>{{ text }}</p>
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
  position: relative;
  overflow: hidden;
  padding: 3px 5px;
  min-width: 24px;
  height: 24px;
  box-sizing: border-box;
  border-radius: 5px;

  color: rgba(255, 255, 255, 0.95);
  background-color: rgba(255, 255, 255, 0.1);
  line-height: 1;
  font-size: 14px;
  display: flex;
  align-items: center;

  .close {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0 5px 0 15px;
    border: none;
    width: 32px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 3px 3px 0;

    background: linear-gradient(to right, transparent, rgba(49, 49, 49, 0.95) 65%);
    color: rgba(255, 255, 255, 0.85);
    opacity: 0;
    transform: translateX(100%);
    pointer-events: none;
    transition: transform 0.18s ease, opacity 0.18s ease, color 0.15s;
    cursor: pointer;

    &:hover {
      color: white;
    }

    .x-icon {
      fill: currentColor;
      width: 12px;
      height: 12px;
      display: block;
      flex-shrink: 0;
    }
  }

  &:hover .close,
  &:focus-within .close {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  @media (hover: none) {
    &:has(.close) {
      padding-right: 28px;
    }

    .close {
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
    }
  }

}
</style>
