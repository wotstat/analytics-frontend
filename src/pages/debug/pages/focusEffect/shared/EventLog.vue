<template>
  <div class="debug-col">
    <div class="debug-row">
      <span class="debug-label">{{ title ?? 'Лог вызовов' }}</span>
      <span class="debug-hint">время от первой записи</span>
      <button class="debug-btn" @click="emit('clear')">Очистить</button>
    </div>

    <div class="debug-log">
      <div class="debug-log-empty" v-if="entries.length === 0">Вызовов пока не было</div>

      <div class="debug-log-line" v-for="entry in entries" :key="entry.id">
        <span class="debug-log-time">{{ entry.time }}</span>
        <span>{{ entry.text }}</span>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import type { EventLogEntry } from './useEventLog'

defineProps<{
  entries: EventLogEntry[]
  title?: string
}>()

const emit = defineEmits<{
  (e: 'clear'): void
}>()

</script>
