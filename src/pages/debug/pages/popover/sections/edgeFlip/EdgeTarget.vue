<template>
  <button class="debug-btn" ref="target" @click="emit('toggle')">{{ label }}</button>

  <Popover :target :display :offset="6" :viewport-offset="viewportOffset" :placement v-slot="{ arrow }">
    <DemoCard>
      <div>цель {{ label }}</div>
      <div class="value">сторона: {{ placementSideByArrow(arrow.direction) }}</div>
    </DemoCard>
  </Popover>
</template>


<script setup lang="ts">
import { useTemplateRef } from 'vue'
import Popover from '@/shared/uiKit/popover/Popover.vue'
import { OffsetValue, PlacementParam } from '@/shared/uiKit/popover/utils'
import DemoCard from '../../shared/DemoCard.vue'
import { placementSideByArrow } from '../../shared/arrowSide'

defineProps<{
  label: string
  display: boolean
  placement: PlacementParam
  viewportOffset: OffsetValue
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const target = useTemplateRef<HTMLElement>('target')

</script>
