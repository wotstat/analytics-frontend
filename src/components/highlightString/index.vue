<template>
  <p>
    <span v-for="label in labelIntervaled" :class="label.highlight ? 'highlight' : ''">{{ label.text }}</span>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HighlightedString } from './highlightUtils';

const props = defineProps<{
  text: HighlightedString
}>()

const labelIntervaled = computed(() => {
  if (!props.text.highlight) return [{ text: props.text, highlight: false }]

  const { text, highlight } = props.text

  const result: { text: string, highlight: boolean }[] = []
  let last = 0
  for (const [start, end] of highlight) {
    result.push({ text: text.slice(last, start), highlight: false })
    result.push({ text: text.slice(start, end + 1), highlight: true })
    last = end + 1
  }

  result.push({ text: text.slice(last), highlight: false })
  return result
})

</script>