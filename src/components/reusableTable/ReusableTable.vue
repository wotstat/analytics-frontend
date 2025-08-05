<template>
  <div class="reusable-table" ref="reusableTable" :style="{ [`--background-color`]: props.backgroundColor }">
    <div class="background-scroll-fallback">
      <div class="fallback-content" ref="fallbackContent">
        <slot v-for="(d, i) in targetDisplayed" v-bind="{ data: d, index: i + startIndex }">
        </slot>
      </div>
    </div>
    <div class="scroll" ref="scroll" @scroll="onScroll">
      <div class="content" ref="content" :style="{ height: (options.height * data.length) + 'px' }">
        <div class="wrapper" ref="wrapper">
          <slot v-for="(d, i) in targetDisplayed" v-bind="{ data: d, index: i + startIndex }">
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts" generic="T">
import { useElementSize } from '@vueuse/core';
import { ref, shallowRef, watch } from 'vue';


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
    overscan?: number
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
  handle = requestAnimationFrame(updateScroll);
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

watch(scrollVelocity, (newValue) => {
  if (newValue == 0) {
    console.log(`Scroll velocity: ${newValue.toFixed(2)} px/s`);
  }
});

function updateScroll() {
  handle = null;

  const scrollTop = scroll.value?.scrollTop || 0;
  const elementHeight = props.options.height;

  const scrollOffset = scrollTop > 0 ? (scrollTop % elementHeight) : scrollTop;
  if (fallbackContent.value)
    fallbackContent.value.style.transform = `translateY(${-scrollOffset}px)`;

  if (wrapper.value)
    wrapper.value.style.transform = `translateY(${scrollTop - scrollOffset}px)`;

  startIndex = clamp(Math.floor(scrollTop / elementHeight) - (props.options.overscan || 0), 0, props.data.length - 1);
  const displayedCount = Math.ceil(height.value / elementHeight) + 1 + (props.options.overscan || 0) * 2;

  targetDisplayed.value = props.data.slice(startIndex, startIndex + displayedCount);
  updateVelocity(scrollTop);
}

watch(() => [props.data, height.value], updateScroll, { immediate: true });

function onScroll(event: Event) {
  scheduleUpdate()
}


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