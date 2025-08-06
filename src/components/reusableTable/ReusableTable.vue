<template>
  <div class="reusable-table" ref="reusableTable" :style="{ [`--background-color`]: props.backgroundColor }">
    <div class="background-scroll-fallback">
      <div class="fallback-content" ref="fallbackContent">
        <slot v-if="!options.cellConstructor" v-for="(d, i) in targetDisplayed"
          v-bind="{ data: d, index: i + startIndex }">
        </slot>
      </div>
    </div>
    <div class="scroll" ref="scroll" @scroll="onScroll">
      <div class="content" ref="content" :style="{ height: (options.height * data.length) + 'px' }">
        <div class="wrapper" ref="wrapper">
          <slot v-if="!options.cellConstructor" v-for="(d, i) in targetDisplayed"
            v-bind="{ data: d, index: i + startIndex }">
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts" generic="T">
import { useElementSize } from '@vueuse/core';
import { ref, shallowRef, watch } from 'vue';
import { type ReusableTableCell } from './ReusableTableCell';


const reusableTable = ref<HTMLElement | null>(null)
const scroll = ref<HTMLElement | null>(null)
const fallbackContent = ref<HTMLElement | null>(null)
const wrapper = ref<HTMLElement | null>(null)

const scrollVelocity = ref(0);

const props = defineProps<{
  data: T[],
  backgroundColor?: string,
  options: {
    height: number,
    overscan?: number,
    cellConstructor?: () => ReusableTableCell<T>
  }
}>()

defineExpose({
  scrollTo: (index: number) => {
    if (scroll.value) {
      const elementHeight = props.options.height;
      const scrollTop = index * elementHeight;
      scroll.value.scrollTop = scrollTop;
      updateScroll();
    }
  },
  scrollVelocity
})

const { height } = useElementSize(reusableTable)

const targetDisplayed = shallowRef<T[]>([])
let startIndex = 0

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

let handle: ReturnType<typeof requestAnimationFrame> | null = null;
function scheduleUpdate() {
  if (handle) return
  handle = requestAnimationFrame(() => updateScroll());
}

let lastScrollTop = 0;
let lastScrollTopTime = 0;
let clearVelocityHandle: ReturnType<typeof requestAnimationFrame> | null = null;
function updateVelocity(scrollTop: number) {
  if (clearVelocityHandle) cancelAnimationFrame(clearVelocityHandle);

  const timeDelta = Date.now() - lastScrollTopTime;
  if (timeDelta > 100 || timeDelta < 1) {
    scrollVelocity.value = 0;
  } else {
    scrollVelocity.value = (scrollTop - lastScrollTop) / (timeDelta / 1000);
  }
  lastScrollTop = scrollTop;
  lastScrollTopTime = Date.now();

  clearVelocityHandle = requestAnimationFrame(() => {
    clearVelocityHandle = null;
    setTimeout(() => {
      if (clearVelocityHandle == null) scrollVelocity.value = 0;
    }, 0);
  });
}

let scrollTop = 0;
let elementHeight = props.options.height;
function updateScroll() {
  handle = null;

  scrollTop = scroll.value?.scrollTop || 0;

  const scrollOffset = scrollTop > 0 ? (scrollTop % elementHeight) : scrollTop;
  if (fallbackContent.value)
    fallbackContent.value.style.transform = `translateY(${-scrollOffset}px)`;

  if (wrapper.value)
    wrapper.value.style.transform = `translateY(${scrollTop - scrollOffset}px)`;

  updateVelocity(scrollTop);
  updateDisplayed();
}

let lastStartIndex = -1;
let lastDisplayedCount = -1;
function updateDisplayed(forceRefreshCells = false) {
  startIndex = clamp(Math.floor(scrollTop / elementHeight) - (props.options.overscan || 0), 0, props.data.length - 1);
  const displayedCount = Math.ceil(height.value / elementHeight) + 1 + (props.options.overscan || 0) * 2;

  if (startIndex !== lastStartIndex || displayedCount !== lastDisplayedCount || forceRefreshCells) {
    lastStartIndex = startIndex;
    lastDisplayedCount = displayedCount;
    targetDisplayed.value = props.data.slice(startIndex, startIndex + displayedCount);
  }
}

watch(() => [height.value], () => updateScroll(), { immediate: true });
watch(() => props.data, () => updateDisplayed(true), { immediate: true });

function onScroll(event: Event) {
  scheduleUpdate()
}


const mainCells: ReusableTableCell<T>[] = [];
const fallbackCells: ReusableTableCell<T>[] = [];
watch(targetDisplayed, (list, old) => {
  if (!props.options.cellConstructor) return;

  const length = list.length;

  if (mainCells.length < length) {

    if (!wrapper.value || !fallbackContent.value) return;

    for (let i = mainCells.length; i < length; i++) {
      const cell = props.options.cellConstructor();
      wrapper.value.appendChild(cell.root);
      mainCells.push(cell);

      const fallbackCell = props.options.cellConstructor();
      fallbackContent.value.appendChild(fallbackCell.root);
      fallbackCells.push(fallbackCell);
    }

  } else if (mainCells.length > length) {
    if (!wrapper.value || !fallbackContent.value) return;

    for (let i = length; i < mainCells.length; i++) {
      mainCells[i].dispose();
      wrapper.value.removeChild(mainCells[i].root);

      fallbackCells[i].dispose();
      fallbackContent.value.removeChild(fallbackCells[i].root);
    }

    mainCells.splice(length, mainCells.length - length);
    fallbackCells.splice(length, fallbackCells.length - length);
  }

  for (let i = 0; i < list.length && i < mainCells.length; i++) {
    mainCells[i].configure(list[i]);
    fallbackCells[i].configure(list[i]);
  }

})


</script>


<style lang="scss" scoped>
.reusable-table {
  height: 100%;
  width: 100%;
  position: relative;


  .background-scroll-fallback {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1;

    contain: strict;
    background: var(--background-color, #480039);
    scrollbar-gutter: stable;
    overflow: hidden;
  }

  .scroll {
    height: 100%;
    width: 100%;

    overflow-y: auto;
    overflow-x: hidden;

    .wrapper {
      background: var(--background-color, #480039);
    }
  }
}
</style>