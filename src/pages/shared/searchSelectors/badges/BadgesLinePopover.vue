<template>
  <div>
    <BadgesLine :tagToText="tagToText" v-model="selected" @openSelectModal="openSelect" ref="badges" />

    <PopoverAutoClose :target="badges?.$el" v-model="displayPopup" :placement="['bottom-start', 'bottom-float']"
      :viewport-offset="{ top: headerHeight + additionalHeaderHeight, bottom: 10, left: 10, right: 10 }"
      :arrow-size="0">
      <slot></slot>
    </PopoverAutoClose>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { headerHeight, useAdditionalHeaderHeight } from '@/composition/useAdditionalHeaderHeight'
import BadgesLine from './BadgesLine.vue'
import PopoverAutoClose from '@/uiKit/popover/PopoverAutoClose.vue'

const props = defineProps<{
  tagToText?: (tag: string) => string
}>()

const selected = defineModel<Set<string>>({ default: new Set() })
const displayPopup = ref<boolean>(false)
const badges = ref<InstanceType<typeof BadgesLine> | null>(null)

const { additionalHeaderHeight } = useAdditionalHeaderHeight(true)

function openSelect() {
  displayPopup.value = !displayPopup.value
}
</script>


<style lang="scss" scoped></style>