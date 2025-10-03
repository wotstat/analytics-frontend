<template>
  <div class="modal-window">
    <div class="background" @click="emit('close')"></div>
    <div class="modal">
      <header v-if="slots['header-content']" :class="{
        'show-border': showHeaderBorder
      }">
        <div class="title-line">
          <h1>{{ title }}</h1>
          <div class="controls">
            <slot name="controls"></slot>
          </div>
        </div>
        <div class="content-line">
          <slot name="header-content"></slot>
        </div>
      </header>

      <main class="nice-scrollbar" ref="scroll" @scroll="handleScroll">
        <slot></slot>
      </main>

      <footer v-if="slots['footer-content']" :class="{
        'show-border': showFooterBorder
      }">
        <slot name="footer-content"></slot>
      </footer>
    </div>
  </div>
</template>


<script setup lang="ts">
import { onMounted, ref, useSlots } from 'vue'
import { useNoScroll } from '../noScroll/noScroll'
import { onKeyDown } from '@vueuse/core'

const scroll = ref<HTMLElement | null>(null)
const showHeaderBorder = ref(false)
const showFooterBorder = ref(false)

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const slots = useSlots()

useNoScroll()

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  showHeaderBorder.value = target.scrollTop > 0
  showFooterBorder.value = target.scrollHeight - target.scrollTop > target.clientHeight + 1
}

onMounted(() => {
  if (scroll.value) {
    handleScroll({ target: scroll.value } as unknown as Event)
  }
})

onKeyDown('Escape', () => emit('close'))

</script>


<style lang="scss" scoped>
$border-transparent: 1px solid transparent;
$border: 1px solid rgba(255, 255, 255, 0.05);

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
    max-height: calc(100dvh - 30px);
    max-width: calc(100vw - 30px);
    margin: auto;
    display: flex;
    flex-direction: column;

    header {
      .title-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 50px;
        max-height: 50px;
        padding: 0;

        h1 {
          font-size: 18px;
          font-weight: normal;
          margin: 0;
          font-weight: bold;
          padding: 0 15px;
        }

        .controls {
          margin-right: 10px;
        }
      }

      border-bottom: $border-transparent;

      &.show-border {
        border-bottom: $border;
      }
    }

    footer {
      border-top: $border-transparent;

      &.show-border {
        border-top: $border;
      }
    }

    main {
      margin: 0 15px;
      overflow-y: scroll;
      scrollbar-gutter: stable;
      margin-right: 3px;
      padding-right: 3px;
      padding-bottom: 15px;
      flex: 1;

      &::-webkit-scrollbar-track {
        margin-block-end: 15px;
        margin-block-start: var(--margin-block-start, 0);
      }
    }

    &:has(footer) {
      main::-webkit-scrollbar-track {
        margin-block-end: 5px;
      }
    }
  }

  @media screen and (max-width: 700px) {
    .modal {
      width: 100vw;
      max-width: 100vw;
      height: calc(100dvh - 30px);
      max-height: 100vh;
      margin: 0;
      margin-top: auto;

      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
}
</style>