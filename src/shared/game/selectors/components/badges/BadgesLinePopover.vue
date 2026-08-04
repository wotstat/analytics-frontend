<template>
  <div>
    <BadgesLine :tagToText="tagToText" :tagToKey="tagToKey" v-model="selected" show-add-button
      @openSelectModal="openSelect" ref="badges" />

    <PopoverAutoClose :target="badges?.$el" v-model="displayPopup" :placement="['bottom-start', 'bottom-float']"
      :viewport-offset="popoverViewportOffset" :arrow-size="0" :close-on-outside-window="closeOnOutsideWindow">
      <slot></slot>
    </PopoverAutoClose>
  </div>
</template>


<script setup lang="ts" generic="T">
import { ComponentInstance, ref, useTemplateRef } from 'vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import BadgesLine from './BadgesLine.vue'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { CloseOnOutsideWindow } from '@/shared/uiKit/popover/utils'

const props = defineProps<{
  tagToText?: (tag: T) => string
  tagToKey?: (tag: T) => string
  closeOnOutsideWindow?: CloseOnOutsideWindow
}>()

const selected = defineModel<Set<T>>({ default: () => new Set() })
const displayPopup = ref<boolean>(false)
const badges = useTemplateRef<ComponentInstance<typeof BadgesLine<T>>>('badges')

function openSelect() {
  displayPopup.value = !displayPopup.value
}
</script>


<style lang="scss" scoped></style>