<template>
  <Teleport to="body">
    <div class="popup-container">
      <div class="card flex ver">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="15"
          height="15" class="close" @click="emit('close')">
          <g>
            <rect height="15.4956" opacity="0" width="15.4859" x="0" y="0" />
            <path
              d="M0.252699 15.2429C0.594496 15.575 1.1609 15.575 1.49293 15.2429L7.74293 8.99293L13.9929 15.2429C14.325 15.575 14.9011 15.5847 15.2332 15.2429C15.5652 14.9011 15.5652 14.3445 15.2332 14.0125L8.98317 7.7527L15.2332 1.5027C15.5652 1.17067 15.575 0.604261 15.2332 0.27223C14.8914-0.0695668 14.325-0.0695668 13.9929 0.27223L7.74293 6.52223L1.49293 0.27223C1.1609-0.0695668 0.58473-0.0793324 0.252699 0.27223C-0.0793324 0.614027-0.0793324 1.17067 0.252699 1.5027L6.5027 7.7527L0.252699 14.0125C-0.0793324 14.3445-0.0890981 14.9109 0.252699 15.2429Z"
              fill-opacity="0.85" />
          </g>
        </svg>
        <h2 class="title" v-if="title !== undefined">{{ title }}&nbsp;</h2>
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  title?: string;
}>()

const emit = defineEmits<{
  close: [];
}>()

onMounted(() => {
  document.body.classList.add('no-scroll')
  document.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.body.classList.remove('no-scroll')
  document.removeEventListener('keydown', onKey)
})

function onKey(params: KeyboardEvent) {
  if (params.key == 'Escape') {
    emit('close')
  }
}


</script>

<style lang="scss" scoped>
@use "/src/styles/mixins.scss" as *;

.popup-container {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  pointer-events: all;

  background-color: rgba(0, 0, 0, 0.5);

  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  .card {
    margin: 40px;
    padding: 20px;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;

    @include less-small {
      margin: 0;
      width: 100%;
      box-sizing: border-box;
      margin-top: 50px;
      height: 100%;
      max-height: 100%;
      border-end-end-radius: 0;
      border-end-start-radius: 0;
    }

    h2.title {
      margin: 0;
      margin-right: 40px;
      margin-top: -0.3em;
    }

    .close {
      position: absolute;
      background-color: #8181813e;
      border-radius: 50%;
      padding: 8px;
      fill: var(--font-color);
      cursor: pointer;
      z-index: 100;

      top: 15px;
      right: 15px;

      &:hover {
        background-color: #8181815e;
      }
    }
  }


}
</style>