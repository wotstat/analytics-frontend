<template>
  <button class="color-preview" @click.stop="showPopup = !showPopup" ref="colorPreview">

    <PopoverStyled :target="colorPreview" :display="showPopup" @pointer-down-outside="showPopup = false"
      :placement="placement" :arrow-size="0" :offset="5">
      <ColorPickerPopup v-model="color" :allowAlpha :savedColors :format="'hex'" />
    </PopoverStyled>
  </button>
</template>


<script setup lang="ts">
import { ColorHSVA, HSLA, RGBA } from '@/shared/uiKit/colorPicker/ColorHSVA'
import ColorPickerPopup from '@/shared/uiKit/colorPicker/ColorPickerPopup.vue'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'
import { PlacementParam } from '@/shared/uiKit/popover/utils'
import { ref, watch } from 'vue'

const { allowAlpha = true, savedColors = true, placement = ['left-float', 'right-float', 'bottom-float'] } = defineProps<{
  allowAlpha?: boolean
  savedColors?: boolean
  placement?: PlacementParam
}>()

const colorPreview = ref<HTMLElement | null>(null)
const showPopup = ref(false)

const color = defineModel<string | RGBA | HSLA>({
  required: false,
})

let colorProc = ref(new ColorHSVA(0, 0, 0, 1))
watch(color, (newColor) => {
  if (newColor) colorProc.value.parseFormat('hex', newColor)
}, { immediate: true, deep: true })

</script>
