<template>
  <div class="card">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" width="15" height="15" class="toFull"
      @click="isFull = !isFull">
      <g transform="matrix(.58303 0 0 .58303 2.73 2.728)">
        <path
          d="m28.36 19.595c0-.868-.665-1.57-1.491-1.57-.819.002-1.492.702-1.492 1.57v3.25l-6.02-6.02c-.582-.583-1.524-.583-2.106 0-.582.582-.582 1.527 0 2.109l5.989 5.987h-3.235c-.881.002-1.591.669-1.591 1.491 0 .824.71 1.49 1.591 1.49h6.761c.881 0 1.59-.665 1.593-1.49-.003-.022-.006-.039-.009-.061.003-.028.009-.058.009-.087v-6.668h-.0001" />
        <path
          d="m9 16.824l-6.01 6.02v-3.25c0-.868-.672-1.568-1.493-1.57-.824 0-1.49.702-1.49 1.57l-.002 6.669c0 .029.008.059.001.087-.002.021-.006.038-.008.061.002.825.712 1.49 1.592 1.49h6.762c.879 0 1.59-.666 1.59-1.49 0-.822-.711-1.489-1.59-1.491h-3.235l5.989-5.987c.58-.582.58-1.527 0-2.109-.583-.584-1.526-.584-2.11-.0001" />
        <path
          d="m19.359 11.535l6.02-6.02v3.25c0 .865.673 1.565 1.492 1.568.826 0 1.491-.703 1.491-1.568v-6.671c0-.029-.006-.059-.009-.085.003-.021.006-.041.009-.062-.003-.826-.712-1.491-1.592-1.491h-6.761c-.881 0-1.591.665-1.591 1.491 0 .821.71 1.49 1.591 1.492h3.235l-5.989 5.987c-.582.581-.582 1.524 0 2.105.582.586 1.524.586 2.106.0001" />
        <path
          d="m5.121 3.442h3.234c.879-.002 1.59-.671 1.59-1.492 0-.826-.711-1.491-1.59-1.491h-6.761c-.88 0-1.59.665-1.592 1.491.002.021.006.041.008.062-.002.026-.001.055-.001.085l.002 6.672c0 .865.666 1.568 1.49 1.568.821-.003 1.493-.703 1.493-1.568v-3.25l6.01 6.02c.584.585 1.527.585 2.11 0 .58-.581.58-1.524 0-2.105l-5.989-5.988" />
      </g>
    </svg>
    <slot></slot>
  </div>
  <Teleport to="body" v-if="isFull">
    <div class="fullscreen" :class="height < windowHeight - 40 ? 'small' : 'large'">
      <div class="card" ref="fullscreenElement">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="15"
          height="15" class="close" @click="isFull = false">
          <g>
            <rect height="15.4956" opacity="0" width="15.4859" x="0" y="0" />
            <path
              d="M0.252699 15.2429C0.594496 15.575 1.1609 15.575 1.49293 15.2429L7.74293 8.99293L13.9929 15.2429C14.325 15.575 14.9011 15.5847 15.2332 15.2429C15.5652 14.9011 15.5652 14.3445 15.2332 14.0125L8.98317 7.7527L15.2332 1.5027C15.5652 1.17067 15.575 0.604261 15.2332 0.27223C14.8914-0.0695668 14.325-0.0695668 13.9929 0.27223L7.74293 6.52223L1.49293 0.27223C1.1609-0.0695668 0.58473-0.0793324 0.252699 0.27223C-0.0793324 0.614027-0.0793324 1.17067 0.252699 1.5027L6.5027 7.7527L0.252699 14.0125C-0.0793324 14.3445-0.0890981 14.9109 0.252699 15.2429Z"
              fill-opacity="0.85" />
          </g>
        </svg>
        <slot name="full"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { useElementBounding, useWindowSize } from '@vueuse/core';
import { ref, watch } from 'vue';


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

}


.card {
  position: relative;
  padding-top: 40px;

  .close,
  .toFull {
    cursor: pointer;
    position: absolute;
    background-color: #8181813e;
    border-radius: 50%;
    padding: 8px;
    fill: var(--font-color);
    cursor: pointer;

    top: 10px;
    right: 10px;

    &:hover {
      background-color: #8181815e;
    }
  }
}
</style>