<template>
  <div class="case">
    <button class="debug-btn" :class="{ active: display }" ref="target" @click="display = !display">
      {{ mode }}
    </button>

    <PopoverAutoClose :target="target" v-model="display" :viewport-offset="viewportOffset" :placement="placement"
      :arrow-size="6" :close-on-outside-window="mode">
      <div class="card-body">
        <div>closeOnOutsideWindow: <b>{{ mode }}</b></div>
        <div class="hint">{{ hint }}</div>
      </div>
    </PopoverAutoClose>
  </div>
</template>


<script setup lang="ts">
import { useTemplateRef } from 'vue'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { CloseOnOutsideWindow, PlacementParam } from '@/shared/uiKit/popover/utils'

defineProps<{
  mode: CloseOnOutsideWindow
  hint: string
  viewportOffset: number
  placement: PlacementParam
}>()

const display = defineModel<boolean>({ required: true })

const target = useTemplateRef<HTMLElement>('target')

</script>


<style scoped lang="scss">
.card-body {
  padding: 0.5em 0.7em;
  font-size: 13px;
  line-height: 1.4;
  max-width: 220px;

  .hint {
    font-size: 11px;
    color: #ffffff80;
  }
}
</style>
