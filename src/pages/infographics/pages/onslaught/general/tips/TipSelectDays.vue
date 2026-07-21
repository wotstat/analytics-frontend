<template>
  <TipBubbleText ref="bubble" bubble-key="onslaught-general-day-selection"
    text="Здесь можно выбрать дни сезона, за которые будут рассчитаны таблицы техники и карт" :display="true"
    :show-bubble="{ type: 'after-open', count: 4 }"
    :auto-extend="{ type: 'after-show-bubble', count: 0, interactSnooze: 20 }" />
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import TipBubbleText from '@/shared/ui/tipBubble/TipBubbleText.vue'

const bubble = useTemplateRef<InstanceType<typeof TipBubbleText>>('bubble')

defineExpose({
  accept: () => bubble.value?.accept(),
})
</script>
