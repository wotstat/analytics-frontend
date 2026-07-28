<template>
  <div class="debug-stage edges" @contextmenu.prevent>
    <button class="debug-btn" v-for="index in 9" :key="index" @contextmenu.prevent="open" @click="open">
      {{ index }}
    </button>
  </div>
</template>


<script setup lang="ts">
const emit = defineEmits<{
  (e: 'open', payload: { event: MouseEvent, element: HTMLElement }): void
}>()

function open(event: MouseEvent) {
  emit('open', { event, element: event.currentTarget as HTMLElement })
}

</script>
