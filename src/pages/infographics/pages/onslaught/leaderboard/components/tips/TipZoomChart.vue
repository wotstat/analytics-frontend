<template>
  <TipBubbleText :bubbleKey="'onslaught-wheel-for-chart-zoom'" :text="text" ref="bubble"
    :showBubble="{ type: 'after-open', count: 2 }"
    :autoExtend="{ type: 'after-show-bubble', count: 2, interactSnooze: 20 }" :display />
</template>


<script setup lang="ts">
import TipBubble from '@/shared/ui/tipBubble/TipBubble.vue'
import { ref } from 'vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'

const bubble = ref<InstanceType<typeof TipBubble> | null>(null)

const props = withDefaults(defineProps<{
  display?: boolean
}>(), { display: undefined })

const text = navigator.maxTouchPoints > 0 ? 'Используйте жесты для увеличения графика' : 'Используйте колесо мыши для увеличения графика'


defineExpose({
  setDisplayed: (visible: boolean, force: boolean = false) => bubble.value?.setDisplayed(visible, force),
  display: (force: boolean = false) => bubble.value?.display(force),
  hide: () => bubble.value?.hide(),
  accept: () => bubble.value?.accept(),
  wrong: () => bubble.value?.wrong(),
})
</script>
