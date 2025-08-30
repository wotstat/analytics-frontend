<template>
  <div class="badge" @auxclick="handleClose">
    <p>{{ text }}</p>
    <button class="close" @click="handleClose" v-if="props.closable">
      <XIcon class="x-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">

import XIcon from '@/assets/icons/x-bold.svg'

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
  padding: 2px 6px;
  height: 20px;
  box-sizing: border-box;
  border-radius: 10px;

  color: white;
  background-color: #2d8af4;
  line-height: 1;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;

  .close {
    padding: 0;
    border: none;
    margin-right: -6px;
    padding-right: 4px;
    padding-left: 3px;
    margin-left: 2px;
    height: 20px;
    border-radius: 0 10px 10px 0;

    background-color: transparent;
    transition: background-color 0.2s;
    cursor: pointer;

    &:hover {
      background-color: rgb(255, 59, 48);
    }

    .x-icon {
      stroke: white;
      height: 0.9em;
      display: block;
    }
  }

}
</style>