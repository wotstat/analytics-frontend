<template>
  <TipBubbleText :bubbleKey="'onslaught-click-to-bar-to-select-day'" :groupKey="'onslaught-chart'"
    :text="'Нажмите на столбик, чтобы увидеть статистику за день'" ref="bubble"
    :showBubble="{ type: 'after-open', count: 2 }"
    :autoExtend="{ type: 'after-show-bubble', count: 2, interactSnooze: 20 }" :display />
</template>


<script setup lang="ts">
import TipBubble from '@/shared/ui/tipBubble/TipBubble.vue'
import { useTemplateRef } from 'vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'

const bubble = useTemplateRef<InstanceType<typeof TipBubble>>('bubble')

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
