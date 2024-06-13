<template>
  <div class="card">
    <div class="control">
      <slot name="control"></slot>
      <div class="icon" @click="isFull = !isFull">
        <FullscreenOpenIcon />
      </div>
    </div>
    <slot name="full"></slot>
  </div>
  <Teleport to="body" v-if="isFull">
    <div class="fullscreen" :class="height < windowHeight - 40 ? 'small' : 'large'">
      <div class="card" ref="fullscreenElement">
        <div class="control">
          <slot name="control"></slot>

          <div class="icon" @click="isFull = false">
            <FullscreenCloseIcon />
          </div>
        </div>
        <slot name="full"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { useElementBounding, useWindowSize } from '@vueuse/core';
import { ref, watch } from 'vue';
import FullscreenOpenIcon from '@/assets/icons/fullscreenOpen.svg'
import FullscreenCloseIcon from '@/assets/icons/fullscreenClose.svg'


const isFull = ref(false)
const fullscreenElement = ref<HTMLElement | null>(null)

const { height } = useElementBounding(fullscreenElement)
const { height: windowHeight } = useWindowSize()

watch(isFull, (val) => {
  if (val) {
    document.body.classList.add('no-scroll');
    document.addEventListener('keydown', onKey);
  } else {
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKey);
  }
}, { immediate: true });

function onKey(params: KeyboardEvent) {
  if (params.key == 'Escape') {
    isFull.value = false;
  }
}

</script>

<style lang="scss" scoped>
@import '@/styles/textColors.scss';

.fullscreen {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  pointer-events: all;

  background-color: rgba($background-color, 0.9);
  padding: 20px;
  overflow-y: auto;

  &.small {
    display: flex;
    justify-content: center;
    flex-direction: column;
  }

  .card {
    width: max-content;
    max-width: calc(100% - 30px);
    margin: auto;
  }

}


.card {
  position: relative;
  padding-top: 45px;

  .control {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 5px;

    :deep(.icon) {
      cursor: pointer;
      background-color: #8181813e;
      border-radius: 50%;
      padding: 8px;
      fill: var(--font-color);
      cursor: pointer;
      width: 15px;
      height: 15px;
      display: flex;


      &:hover {
        background-color: #8181815e;
      }
    }
  }
}
</style>