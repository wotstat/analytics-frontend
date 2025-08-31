<template>
  <div class="modal-window">
    <div class="background"></div>
    <div class="modal">
      <header :class="{
        'show-border': showHeaderBorder
      }">
        <h1>{{ title }}</h1>
        <div class="controls">
          <slot name="controls"></slot>
        </div>
      </header>

      <main class="nice-scrollbar" ref="scroll" @scroll="handleScroll">
        <slot></slot>
      </main>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useNoScroll } from '../noScroll/noScroll'
import { onKeyDown } from '@vueuse/core'

const scroll = ref<HTMLElement | null>(null)
const showHeaderBorder = ref(false)

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

useNoScroll()

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  showHeaderBorder.value = target.scrollTop > 0
}

onKeyDown('Escape', () => emit('close'))

</script>


<style lang="scss" scoped>
.modal-window {
  position: fixed;
  inset: 0;
  z-index: 1000;

  display: flex;

  .background {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }

  .modal {
    border-radius: 15px;
    box-sizing: border-box;

    background-color: rgb(38, 38, 38);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);

    width: 800px;
    height: 900px;
    max-height: calc(100vh - 30px);
    max-width: calc(100vw - 30px);
    margin: auto;
    display: flex;
    flex-direction: column;

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 50px;
      max-height: 50px;
      padding: 0 15px;
      border-bottom: 1px solid transparent;

      &.show-border {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      h1 {
        font-size: 18px;
        font-weight: normal;
        margin: 0;
        font-weight: bold;
      }

      .controls {}
    }

    main {
      margin: 0 15px;
      overflow-y: scroll;
      scrollbar-gutter: stable;
      margin-right: 3px;
      padding-right: 3px;
      padding-bottom: 15px;

      &::-webkit-scrollbar-track {
        margin-block-end: 15px;
      }
    }
  }

  @media screen and (max-width: 700px) {
    .modal {
      width: 100vw;
      max-width: 100vw;
      height: calc(100vh - 30px);
      max-height: 100vh;
      margin: 0;
      margin-top: auto;

      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
}
</style>