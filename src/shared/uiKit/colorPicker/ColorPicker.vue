<template>
  <div class="color-preview" :style="{
    backgroundColor: `#${colorProc.toHex()}`,
  }" @click="showPopup = true" ref="colorPreview">

    <PopoverStyled :target="colorPreview" :display="showPopup" @click-outside="showPopup = false" :placement="placement"
      :arrow-size="0" :offset="5">
      <ColorPickerPopup v-model="color" :allowAlpha :savedColors :format />
    </PopoverStyled>
  </div>
</template>


<script setup lang="ts">
import { ref, watch } from 'vue'
import ColorPickerPopup from './ColorPickerPopup.vue'
import PopoverStyled from '../popover/PopoverStyled.vue'
import { ColorHSVA, HSLA, RGBA } from './ColorHSVA'
import { PlacementParam } from '../popover/utils'

const { allowAlpha = true, savedColors = true, format = 'hex', placement = ['left-float', 'right-float', 'bottom-float'] } = defineProps<{
  allowAlpha?: boolean
  savedColors?: boolean
  format?: 'hex' | 'rgba' | 'hsla'
  placement?: PlacementParam
}>()

const colorPreview = ref<HTMLElement | null>(null)
const showPopup = ref(false)

const color = defineModel<string | RGBA | HSLA>({
  required: false,
})

let colorProc = ref(new ColorHSVA(0, 0, 0, 1))
watch(color, (newColor) => {
  if (newColor) colorProc.value.parseFormat(format, newColor)
}, { immediate: true, deep: true })

</script>


<style lang="scss" scoped>
.color-preview {
  height: 1em;
  width: 3em;

  border-radius: 5px;
  border: 1px solid #828282;

  cursor: pointer;
}
</style>