<template>
  <div class="badge" @auxclick="handleClose">
    <p>{{ text }}</p>
    <XIcon class="x-icon" @click="handleClose" v-if="props.closable" />
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
  color: white;
  border-radius: 1em;
  line-height: 1;
  background-color: rgb(0, 132, 255);
  padding: 2px 6px;
  font-size: 0.8em;
  font-weight: bold;
  display: flex;
  align-items: center;

  .x-icon {
    stroke: white;
    height: 0.9em;
    margin-left: 3px;
    cursor: pointer;
    transition: stroke 0.3s;
    margin-right: -2px;

    &:hover {
      stroke: rgb(255, 59, 48);
    }
  }
}
</style>