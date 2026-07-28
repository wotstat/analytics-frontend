<template>
  <div class="render-guard">
    <slot v-if="!failure"></slot>

    <div class="failure debug-col" v-else>
      <p class="debug-hint">Содержимое упало на рендере:</p>
      <p class="debug-value error">{{ failure }}</p>
      <button class="debug-btn" @click="failure = null">Смонтировать заново</button>
    </div>
  </div>
</template>


<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const failure = ref<string | null>(null)

onErrorCaptured(error => {
  failure.value = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return false
})

</script>


<style scoped lang="scss">
.failure {
  border: 1px dashed rgb(255, 59, 48);
  border-radius: 6px;
  padding: 0.7em;
  align-items: flex-start;

  .error {
    color: rgb(255, 120, 112);
  }
}
</style>
