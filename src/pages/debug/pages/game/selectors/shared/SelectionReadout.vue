<template>
  <div class="debug-col">
    <div class="debug-row">
      <span class="debug-label">{{ title ?? 'Выбрано' }}</span>
      <span class="debug-value">{{ selected.size }}<template v-if="total !== undefined"> / {{ total }}</template></span>
      <slot></slot>
      <button class="debug-btn" @click="clear">очистить</button>
    </div>

    <div class="debug-log">
      <div class="debug-log-empty" v-if="selected.size === 0">Ничего не выбрано</div>

      <div class="debug-log-line" v-for="tag in visibleTags" :key="tag">
        <span class="debug-log-time">{{ tag === '' ? '(пустая строка)' : tag }}</span>
        <span v-if="tagToText">{{ tagToText(tag) }}</span>
      </div>

      <div class="debug-log-empty" v-if="hiddenCount > 0">…и ещё {{ hiddenCount }}</div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'

const MAX_VISIBLE = 150

defineProps<{
  title?: string
  tagToText?: (tag: string) => string
  total?: number
}>()

const selected = defineModel<Set<string>>({ required: true })

const visibleTags = computed(() => [...selected.value].slice(0, MAX_VISIBLE))
const hiddenCount = computed(() => Math.max(0, selected.value.size - MAX_VISIBLE))

function clear() {
  selected.value.clear()
}

</script>
