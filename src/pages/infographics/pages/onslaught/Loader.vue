<template>
  <div class="loader" :class="{ 'loading': isLoading }">
    <Transition>
      <div v-if="isLoading" class="loader-line"></div>
    </Transition>
  </div>
</template>


<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  isLoading: boolean
}>()

const loadingTimeHistory = ref([500])

let lastLoadingTimeStart = 0
watch(() => props.isLoading, (newVal) => {
  if (newVal) {
    lastLoadingTimeStart = Date.now()
  } else {
    const loadingDuration = Date.now() - lastLoadingTimeStart
    if (loadingDuration < 100) return

    setTimeout(() => {
      loadingTimeHistory.value.push(loadingDuration)
      if (loadingTimeHistory.value.length > 2) loadingTimeHistory.value.shift()
    }, 200)
  }
})

const animationDuration = computed(() => {
  if (loadingTimeHistory.value.length === 0) return '1s'
  const avgLoadingTime = loadingTimeHistory.value.reduce((a, b) => a + b, 0) / loadingTimeHistory.value.length
  return `${Math.max(300, Math.min(avgLoadingTime * 1.5, 3000))}ms`
})

</script>


<style lang="scss" scoped>
.loader {
  display: flex;
  justify-content: center;
  align-items: center;

  .loader-line {
    width: 10%;
    height: 100%;
    background: #50b6ffa4;
    border-radius: 20px;
    animation: loading v-bind(animationDuration) ease-in-out infinite alternate;
    will-change: width;
  }

  @keyframes loading {
    0% {
      width: 10px;
    }

    100% {
      width: 100%;
    }
  }

  .v-enter-active,
  .v-leave-active {
    transition: opacity 0.2s;
  }

  .v-enter-from,
  .v-leave-to {
    opacity: 0;
  }
}
</style>