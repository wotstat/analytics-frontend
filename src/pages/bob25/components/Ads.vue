<template>
  <div class="wotstat-more" v-if="visible">
    <h2>Спасибо, что выбрали WotStat!</h2>
    <p>Ты следил за статистикой Битвы Блогеров? Круто!</p>
    <p>Но WotStat — это не только про ББ!</p>
    <div class="space"></div>
    <p>Обрати внимание на вкладки сверху, там ещё много интересного! Например, распределение снарядов в круге сведения.
    </p>
    <div class="close" @click="close">
      <XIcon />
    </div>

    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" class="arrow">
      <path class="path" stroke-width="5"
        d="M51.805 104.786c-11.993-9.495-33.25-43.769-15.491-60.467 8.408-7.905 17.133-13.423 27.985-9.494 13.64 4.938 20.234 23.513 11.71 35.25-7.613 10.484-19.514 12.217-32.894 4.313-12.491-7.378-20.236-20.8-24.42-34.691-3.784-12.567-3.432-32.63-3.432-32.63" />
      <path class="end" fill-rule="evenodd"
        d="M13.722.593c.908-.79 2.26-.79 3.168 0 2.142 1.863 5.186 4.553 7.942 6.988 1.816 1.604 3.507 3.099 4.732 4.173 1.04.912 1.256 2.493.476 3.637-.859 1.257-2.573 1.492-3.718.489-1.365-1.196-3.218-2.833-5.155-4.544l-3.234-2.855a3.986 3.986 0 0 0-5.263-.007l-1.817 1.592c-2.46 2.155-4.945 4.333-6.66 5.822-1.15.998-2.866.76-3.724-.497-.78-1.144-.564-2.722.481-3.63 1.572-1.364 3.907-3.411 6.29-5.5C9.582 4.21 11.969 2.118 13.723.593Z"
        clip-rule="evenodd" />
    </svg>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import XIcon from '@/assets/icons/x.svg'
import { useLocalStorage } from '@vueuse/core';

const visible = useLocalStorage('bob25-show-wotstat-more', true);

function close() {
  visible.value = false;
}

</script>


<style lang="scss" scoped>
.wotstat-more {
  position: absolute;
  top: 165px;
  right: 40px;
  background: #1080d6;
  padding: 10px;
  border-radius: 10px;
  color: white;
  max-width: 400px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(40px);

  @media screen and (max-width: 1100px) {
    position: unset;
    max-width: 100%;
  }
}

h2 {
  margin: 0;
  margin-bottom: 10px;
  font-size: 15px;
}

.space {
  margin-top: 10px;
}

p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.close {
  position: absolute;
  top: 5px;
  right: 5px;
  cursor: pointer;
  padding: 5px;
  width: 15px;
  height: 15px;
  fill: white;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;

  svg {
    display: block;
  }
}

.arrow {
  position: absolute;
  top: 0;
  transform: translateY(-100%);
  z-index: -1;
  width: 140px;

  @media screen and (max-width: 1100px) {
    display: none;
  }

  path {
    stroke: #1080d6;
    stroke-dasharray: 256;
    stroke-dashoffset: 256;
    pointer-events: none;
    animation: animateDash 3s ease 1s forwards;
  }

  .end {
    fill: #1080d6;
    transform: rotate(90deg);

    offset-path: path('M51.805 104.786c-11.993-9.495-33.25-43.769-15.491-60.467 8.408-7.905 17.133-13.423 27.985-9.494 13.64 4.938 20.234 23.513 11.71 35.25-7.613 10.484-19.514 12.217-32.894 4.313-12.491-7.378-20.236-20.8-24.42-34.691-3.784-12.567-3.432-32.63-3.432-32.63');
    offset-distance: 0;
    animation: move 3s ease 1s forwards;
    offset-anchor: -2px 15px;
  }
}

@keyframes animateDash {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes move {
  0% {
    offset-distance: 0%;
  }

  100% {
    offset-distance: 100%;
  }
}
</style>