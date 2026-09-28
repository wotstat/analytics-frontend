<template>
  <div>
    <BadgesLine :tagToText="tagToText" :tagToKey="tagToKey" v-model="selected" show-add-button
      @openSelectModal="openSelect" ref="badges" />

    <PanelPopover v-model="displayPopup" :target="badges?.$el ?? null"
      :placement="placement ?? ['bottom-start', 'bottom-float']" :close-on-outside-window="closeOnOutsideWindow"
      :title :width :density :scroll-mode="scrollMode" :offset :arrow-size="arrowSize">
      <template v-if="$slots.header" #header><slot name="header" /></template>
      <template v-if="$slots.toolbar" #toolbar><slot name="toolbar" /></template>
      <template #content><slot /></template>
      <template v-if="$slots.footer" #footer><slot name="footer" /></template>
    </PanelPopover>
  </div>
</template>


<script setup lang="ts" generic="T">
import { ComponentInstance, ref, useTemplateRef } from 'vue'
import BadgesLine from './BadgesLine.vue'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import type { CloseOnOutsideWindow, OffsetValue, PlacementParam } from '@/shared/uiKit/popover/utils'

defineProps<{
  tagToText?: (tag: T) => string
  tagToKey?: (tag: T) => string
  closeOnOutsideWindow?: CloseOnOutsideWindow
  title?: string
  width?: number
  density?: 'standard' | 'compact'
  scrollMode?: 'panel' | 'child'
  placement?: PlacementParam
  offset?: OffsetValue
  arrowSize?: number
}>()

const selected = defineModel<Set<T>>({ default: () => new Set() })
const displayPopup = ref<boolean>(false)
const badges = useTemplateRef<ComponentInstance<typeof BadgesLine<T>>>('badges')

function openSelect() {
  displayPopup.value = !displayPopup.value
}

</script>
