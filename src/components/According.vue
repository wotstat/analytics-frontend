<template>
  <div class="according" :class="isOpen ? 'open' : ''">
    <div class="header" @click="toggle">
      <div class="collapse-icon">
        <ArrowDownIcon class="icon" />
      </div>
      <slot name="header"></slot>
    </div>

    <div class="panel" ref="panel">
      <div class="content">
        <slot name="panel"></slot>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg'


const isOpen = ref(false)
const panel = ref<HTMLElement | null>(null)


function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    panel.value?.style.setProperty('max-height', `${panel.value?.scrollHeight}px`)
  } else {
    panel.value?.style.setProperty('max-height', '0')
  }
}

</script>


<style lang="scss" scoped>
.according {

  &.open {
    .header {
      .collapse-icon {
        transform: rotate(0);
      }
    }
  }

  .header {
    cursor: pointer;
    padding: 0.5em 0;
    user-select: none;
    width: 100%;
    transition: 0.4s;

    display: flex;
    align-items: center;
    gap: 5px;

    .collapse-icon {
      border-radius: 50%;
      transition: 0.4s;
      transform: rotate(-90deg);
      width: 20px;
      height: 20px;

      .icon {
        display: block;
        width: 100%;
        height: 100%;
        margin: 0;
      }
    }
  }

  .panel {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.2s ease-out;

    .content {
      margin-bottom: 1.5em;
    }
  }
}
</style>