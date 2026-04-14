<template>
  <TipBubbleText :bubbleKey="'onslaught-click-to-bar-to-select-day'" :groupKey="'onslaught-chart'"
    :text="'Выберите день, чтобы увидеть статистику за него'" ref="bubble"
    :showBubble="{ type: 'after-open', count: 4 }"
    :autoExtend="{ type: 'after-show-bubble', count: 7, interactSnooze: 20 }" :display />
</template>


<script setup lang="ts">
import TipBubble from '@/shared/ui/tipBubble/TipBubble.vue'
import { ref, watch } from 'vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'

const bubble = ref<InstanceType<typeof TipBubble> | null>(null)

const props = withDefaults(defineProps<{
  display?: boolean
}>(), { display: undefined })


defineExpose({
  setDisplayed: (visible: boolean, force: boolean = false) => bubble.value?.setDisplayed(visible, force),
  display: (force: boolean = false) => bubble.value?.display(force),
  hide: () => bubble.value?.hide(),
  accept: () => bubble.value?.accept(),
  wrong: () => bubble.value?.wrong(),
})
</script>
