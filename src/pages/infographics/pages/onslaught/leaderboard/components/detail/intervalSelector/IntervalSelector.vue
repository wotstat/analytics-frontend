<template>
  <div class="interval-selector">
    <button ref="btn" @click="openSelect">
      <p>{{ label }}</p>
      <DropdownArrow :isOpen="displayPopup" class="icon" />
    </button>
  </div>

  <PopoverAutoClose :target="btn" v-model="displayPopup" :placement="['bottom-end', 'bottom-float']"
    :viewport-offset="{ top: headerHeight + additionalHeaderHeight, bottom: 10, left: 10, right: 10 }" :arrow-size="0"
    :class="'comp7-tooltip'">
    <IntervalPopup :seasonInterval="seasonInterval" @select="onSelect" />
  </PopoverAutoClose>
</template>


<script setup lang="ts">
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { computed, ref } from 'vue'
import { headerHeight, useAdditionalHeaderHeight } from '@/pages/shared/header/useAdditionalHeaderHeight'
import IntervalPopup from './IntervalPopup.vue'
import DropdownArrow from './DropdownArrow.vue'


const btn = ref<HTMLElement | null>(null)

export type SelectedInterval = { start: Date, end: Date, name?: string }

const props = defineProps<{
  seasonInterval: { start: Date, end: Date, length: number }
}>()

const model = defineModel<SelectedInterval | null>({ default: null })

const label = computed(() => {
  if (!model.value) return 'Всё время'
  return model.value.name ?? 'Другое'
})

const displayPopup = ref<boolean>(false)

const { additionalHeaderHeight } = useAdditionalHeaderHeight(true)

function openSelect() {
  displayPopup.value = !displayPopup.value
}

function onSelect(value: SelectedInterval) {
  displayPopup.value = false
  model.value = value
}
</script>


<style lang="scss" scoped>
.interval-selector {
  margin-right: 4.5px;

  button {
    padding: 2px 5px;
    display: flex;
    align-items: center;
    gap: 3px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);

    font-size: 14px;
    color: #ffffffe0;

    .icon {
      display: block;
      width: 12px;
      height: 12px;
      margin-top: 2px;
      transform: scale(0.85);
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

}
</style>