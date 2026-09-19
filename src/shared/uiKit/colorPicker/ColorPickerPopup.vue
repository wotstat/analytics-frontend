<template>
  <div class="picker-container">
    <div class="preview" @pointerdown.stop.prevent.left="onPalettePointerDown" ref="paletteElement"
      :test="color.cssString">
      <div class="base" :style="{ backgroundColor: `hsl(${color.h}deg 100% 50%)` }"></div>
      <div class="white"></div>
      <div class="black"></div>

      <div class="handle-container">
        <div class="handle"
          :style="{ left: `${Math.pow(color.s, 1 / PX_GAMMA) * 100}%`, top: `${(100 - Math.pow(color.v, 1 / PY_GAMMA) * 100)}%` }">
          <div class="background-1"></div>
          <div class="background-2"></div>
          <div class="color" :style="{ backgroundColor: color.cssOpaqueString }"></div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="color-sliders">

        <div class="color">
          <div class="background chess"></div>
          <div class="background" :style="{ backgroundColor: color.cssString }"></div>
        </div>

        <div class="sliders">
          <div class="hue-line slider" @pointerdown.stop.prevent.left="onHuePointerDown" ref="hueSlider">
            <div class="handle" :style="{ left: `${100 - (hsla.h / 360 * 100)}%` }">
              <div class="handle-fill"></div>
            </div>
          </div>

          <div class="opacity-line slider" @pointerdown.stop.prevent.left="onOpacityPointerDown" ref="opacitySlider"
            v-if="allowAlpha">
            <div class="background chess"></div>
            <div class="background gradient"
              :style="{ background: `linear-gradient(90deg, hsla(${hsla.h}deg ${hsla.s * 100}% ${hsla.l * 100}% / 0), hsla(${hsla.h}deg ${hsla.s * 100}% ${hsla.l * 100}% / 1))` }">
            </div>
            <div class="handle" :style="{ left: `${hsla.a * 100}%` }">
              <div class="handle-fill"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="value-input">

        <div class="value-rgb values" v-if="valueInputType == 'rgba'">
          <div class="r input-column">
            <input type="text" :value="rgbaInputValue.r" @input="e => updateRgba('r', e)" />
            <span>R</span>
          </div>

          <div class="g input-column">
            <input type="text" :value="rgbaInputValue.g" @input="e => updateRgba('g', e)" />
            <span>G</span>
          </div>

          <div class="b input-column">
            <input type="text" :value="rgbaInputValue.b" @input="e => updateRgba('b', e)" />
            <span>B</span>
          </div>

          <div class="a input-column" v-if="allowAlpha">
            <input type="text" :value="rgbaInputValue.a" @input="e => updateRgba('a', e)" />
            <span>A</span>
          </div>
        </div>

        <div class="value-rgb values" v-else-if="valueInputType == 'hex'">
          <div class="r input-column">
            <input type="text" :value="hexInputValue" @input="e => updateHex(e)" />
            <span>HEX</span>
          </div>
        </div>

        <div class="value-rgb values" v-if="valueInputType == 'hsla'">
          <div class="h input-column">
            <input type="text" :value="hslaInputValue.h" @input="e => updateHsla('h', e)" />
            <span>H</span>
          </div>

          <div class="s input-column">
            <input type="text" :value="hslaInputValue.s" @input="e => updateHsla('s', e)" />
            <span>S</span>
          </div>

          <div class="l input-column">
            <input type="text" :value="hslaInputValue.l" @input="e => updateHsla('l', e)" />
            <span>L</span>
          </div>

          <div class="a input-column" v-if="allowAlpha">
            <input type="text" :value="hslaInputValue.a" @input="e => updateHsla('a', e)" />
            <span>A</span>
          </div>
        </div>

        <button class="change" @pointerdown.stop.prevent="showContextMenu">
          <ArrowUpDown />
        </button>

      </div>

      <div class="favorites" v-if="displaySavedColors">
        <button class="color" v-for="(color, i) in savedColors" @contextmenu="event => showColorContextMenu(event, i)"
          @click="applyColor(color)">
          <div class="layer chess"></div>
          <div class="layer" :style="{ backgroundColor: `#${color}` }"></div>
        </button>
        <button class="add" @click="addColor">
          <Add />
        </button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ColorHSVA, HSLA, RGBA } from './ColorHSVA'
import { useLocalStorage, watchPausable } from '@vueuse/core'
import { options, simpleContextMenu } from '../contextMenu/simpleContextMenu'
import ArrowUpDown from './arrow-up-down.svg'
import Add from './add.svg'

const PX_GAMMA = 1.25
const PY_GAMMA = 1


const { allowAlpha = true, savedColors: displaySavedColors = true, format } = defineProps<{
  allowAlpha?: boolean
  savedColors?: boolean
  format: 'hex' | 'rgba' | 'hsla'
}>()

const value = defineModel<string | RGBA | HSLA>({
  required: false,
})

const hueSlider = ref<HTMLElement | null>(null)
const opacitySlider = ref<HTMLElement | null>(null)
const paletteElement = ref<HTMLElement | null>(null)
const valueInputType = useLocalStorage<'hex' | 'rgba' | 'hsla'>('color-picker:color-input-variant', 'rgba')
const savedColors = useLocalStorage<string[]>('color-picker:saved-colors-preset-main', [])

const rgbaInputValue = ref({ r: '0', g: '0', b: '0', a: '1' })
const hslaInputValue = ref({ h: '0', s: '100', l: '50', a: '1' })
const hexInputValue = ref('')

const color = ref(new ColorHSVA(0, 0, 0, 1))

const hsla = computed(() => color.value.toHsla())

const { stop, pause, resume } = watchPausable(value, (newValue) => {
  if (newValue) color.value.parseFormat(format, newValue)
}, { immediate: true })

watch(color, (newColor) => {
  pause()
  value.value = newColor.toFormat(format)
  nextTick(() => resume())
}, { immediate: true, deep: true })


function updateOpacityValue(clientX: number) {
  if (!opacitySlider.value) return
  const rect = opacitySlider.value.getBoundingClientRect()
  let a = (clientX - rect.left) / rect.width

  if (clientX < rect.left) a = 0
  else if (clientX > rect.right) a = 1

  color.value.setHsva(color.value.h, color.value.s, color.value.v, a)
}

function updateHueValue(clientX: number) {
  if (!hueSlider.value) return
  const rect = hueSlider.value.getBoundingClientRect()
  let hue = (1 - (clientX - rect.left) / rect.width) * 360

  if (clientX < rect.left) hue = 360
  if (clientX > rect.right) hue = 0

  color.value.setHsva(hue, color.value.s, color.value.v, color.value.a)
}

function updatePaletteColor(clientX: number, clientY: number) {
  if (!paletteElement.value) return
  const rect = paletteElement.value.getBoundingClientRect()
  const px = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const py = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height))

  color.value.setHsva(color.value.h, Math.pow(px, PX_GAMMA), Math.pow(py, PY_GAMMA), color.value.a)
}


let isHuePointerDown = false
function onHuePointerDown(event: PointerEvent) {
  if (!hueSlider.value) return
  isHuePointerDown = true

  updateHueValue(event.clientX)
  window.addEventListener('pointermove', onHuePointerMove)
  window.addEventListener('pointerup', onHuePointerUp, { capture: true })
  document.body.classList.add('color-picker-slider-move')
}

function onHuePointerMove(event: PointerEvent) {
  updateHueValue(event.clientX)
}

function onHuePointerUp(event: PointerEvent) {
  if (!isHuePointerDown) return
  isHuePointerDown = false

  event.preventDefault()
  event.stopPropagation()
  updateHueValue(event.clientX)
  window.removeEventListener('pointermove', onHuePointerMove)
  window.removeEventListener('pointerup', onHuePointerUp, { capture: true })
  document.body.classList.remove('color-picker-slider-move')
}

let isOpacityPointerDown = false
function onOpacityPointerDown(event: PointerEvent) {
  if (!opacitySlider.value) return
  isOpacityPointerDown = true

  updateOpacityValue(event.clientX)
  window.addEventListener('pointermove', onOpacityPointerMove)
  window.addEventListener('pointerup', onOpacityPointerUp, { capture: true })
  document.body.classList.add('color-picker-handle-move')
}

function onOpacityPointerMove(event: PointerEvent) {
  updateOpacityValue(event.clientX)
}

function onOpacityPointerUp(event: PointerEvent) {
  if (!isOpacityPointerDown) return
  isOpacityPointerDown = false

  event.preventDefault()
  event.stopPropagation()
  updateOpacityValue(event.clientX)
  window.removeEventListener('pointermove', onOpacityPointerMove)
  window.removeEventListener('pointerup', onOpacityPointerUp, { capture: true })
  document.body.classList.remove('color-picker-handle-move')
}

let isPalettePointerDown = false
function onPalettePointerDown(event: PointerEvent) {
  if (!paletteElement.value) return
  isPalettePointerDown = true

  updatePaletteColor(event.clientX, event.clientY)
  window.addEventListener('pointermove', onPalettePointerMove)
  window.addEventListener('pointerup', onPalettePointerUp, { capture: true })
  document.body.classList.add('color-picker-slider-move')
  event.preventDefault()
  event.stopPropagation()
}

function onPalettePointerMove(event: PointerEvent) {
  if (!paletteElement.value) return
  updatePaletteColor(event.clientX, event.clientY)
}

function onPalettePointerUp(event: PointerEvent) {
  if (!isPalettePointerDown) return
  isPalettePointerDown = false

  event.preventDefault()
  event.stopPropagation()
  if (!paletteElement.value) return
  updatePaletteColor(event.clientX, event.clientY)
  document.body.classList.remove('color-picker-slider-move')
  window.removeEventListener('pointermove', onPalettePointerMove)
  window.removeEventListener('pointerup', onPalettePointerUp, { capture: true })
}

function showContextMenu(event: MouseEvent) {
  simpleContextMenu({ position: { x: event.clientX, y: event.clientY }, closeOnAction: true, actionOnPointerUp: true }, [
    ...options(valueInputType, [
      { key: 'hex', label: 'hex' },
      { key: 'rgba', label: allowAlpha ? 'rgba' : 'rgb' },
      { key: 'hsla', label: allowAlpha ? 'hsla' : 'hsl' }] as const)
  ])
}

function syncRgba() {
  const rgba = color.value.toRgba()
  rgbaInputValue.value.r = rgba.r.toString()
  rgbaInputValue.value.g = rgba.g.toString()
  rgbaInputValue.value.b = rgba.b.toString()
  rgbaInputValue.value.a = rgba.a.toFixed(2)
}

function syncHsla() {
  const hsla = color.value.toHsla()
  hslaInputValue.value.h = Math.round(hsla.h).toString()
  hslaInputValue.value.s = Math.round(hsla.s * 100) + '%'
  hslaInputValue.value.l = Math.round(hsla.l * 100) + '%'
  hslaInputValue.value.a = hsla.a.toFixed(2)
}

function syncHex() {
  let hex = color.value.toHex()
  if (hex.endsWith('ff') || !allowAlpha) hex = hex.slice(0, -2)
  hexInputValue.value = `#${hex}`
}

watch(valueInputType, (newValue) => {
  if (newValue == 'rgba') syncRgba()
  else if (newValue == 'hsla') syncHsla()
  else if (newValue == 'hex') syncHex()
}, { immediate: true })

const { pause: pauseColor, resume: resumeColor } = watchPausable(color, (newValue) => {
  if (valueInputType.value == 'rgba') syncRgba()
  else if (valueInputType.value == 'hsla') syncHsla()
  else if (valueInputType.value == 'hex') syncHex()
}, { immediate: true, deep: true })


function updateRgba(value: 'r' | 'g' | 'b' | 'a', event: Event) {
  const target = event.target as HTMLInputElement
  if (value != 'a') rgbaInputValue.value[value] = target.value.replaceAll(/[^0-9]/g, '').slice(0, 4)
  else rgbaInputValue.value[value] = target.value.replaceAll(/[^0-9|\.]/g, '').slice(0, 4)

  target.value = rgbaInputValue.value[value]
  pauseColor()
  color.value.parseRgba(rgbaInputValue.value.r, rgbaInputValue.value.g, rgbaInputValue.value.b, rgbaInputValue.value.a)
  nextTick(() => resumeColor())
}

function updateHsla(value: 'h' | 's' | 'l' | 'a', event: Event) {
  const target = event.target as HTMLInputElement

  if (value == 'a') hslaInputValue.value[value] = target.value.replaceAll(/[^0-9|\.]/g, '').slice(0, 4)
  else if (value == 'h') hslaInputValue.value[value] = target.value.replaceAll(/[^0-9]/g, '').slice(0, 4)
  else hslaInputValue.value[value] = target.value.replaceAll(/[^0-9|\%]/g, '').slice(0, 4)

  target.value = hslaInputValue.value[value]
  pauseColor()
  color.value.parseHsla(hslaInputValue.value.h, hslaInputValue.value.s, hslaInputValue.value.l, hslaInputValue.value.a)
  nextTick(() => resumeColor())
}

function updateHex(event: Event) {
  const target = event.target as HTMLInputElement
  const cleaned = target.value
    .replaceAll(/[^0-9a-fA-F#]/g, '')
    .replaceAll(/(?!^)#/g, '')

  hexInputValue.value = cleaned.slice(0, cleaned.startsWith('#') ? 9 : 8)
  target.value = hexInputValue.value

  pauseColor()
  color.value.paseHex(hexInputValue.value)
  nextTick(() => resumeColor())
}

function addColor() {
  const hex = color.value.toHex()

  savedColors.value.push(hex)
  if (savedColors.value.length > 19) savedColors.value.shift() // Limit to 10 colors
}

function applyColor(colorHex: string) {
  color.value.setHex(colorHex)
}

function showColorContextMenu(event: MouseEvent, index: number) {
  event.preventDefault()
  event.stopPropagation()

  simpleContextMenu({ position: { x: event.clientX, y: event.clientY }, closeOnAction: true, actionOnPointerUp: true }, [
    {
      label: 'Remove',
      action: () => savedColors.value.splice(index, 1)
    },
    {
      label: 'Clear all to the right',
      action: () => savedColors.value.splice(index + 1, savedColors.value.length - index - 1)
    },
    {
      label: 'Clear all',
      action: () => savedColors.value.splice(0, savedColors.value.length)
    }
  ])

}

</script>


<style lang="scss" scoped>
.picker-container {
  width: 230px;
  touch-action: none;
  user-select: none;
}

.preview {
  width: 100%;
  height: 130px;
  background-color: #fff;
  cursor: crosshair;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    pointer-events: none;
    background: var(--background-color, #fff);
  }

  .base,
  .white,
  .black {
    position: absolute;
    inset: 0;
  }

  .white {
    background: linear-gradient(90deg, #fff, hsla(0, 0%, 100%, 0));
  }

  .black {
    background: linear-gradient(0deg, #000, hsla(0, 0%, 0%, 0));
  }

  .handle-container {
    position: absolute;
    overflow: hidden;
    inset: 0;
  }

  .handle {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 15px;
    height: 15px;
    cursor: all-scroll;
    border-radius: 50%;
    box-shadow: 0 2px 4px 1px rgba(0, 0, 0, 0.2);

    .background-1,
    .background-2,
    .color {
      position: absolute;
      inset: 0;
      border-radius: 50%;
    }

    .background-1 {
      background-color: rgb(200, 200, 200, 0.5);
    }

    .background-2 {
      inset: 1px;
      background-color: rgb(29, 29, 29);
    }

    .color {
      inset: 2px;
    }
  }
}

.content {
  padding: 15px;
  padding-bottom: 6px;

  &:has(.favorites) {
    padding-bottom: 8px;
  }

  .color-sliders {
    display: flex;

    .color {
      width: 30px;
      height: 30px;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 7px;
        border: 2px solid var(--background-color, #fff);
      }

      .background {
        position: absolute;
        inset: -1px;
        border-radius: 6px;
      }

      .chess {
        inset: -1px;
        background-size: 11px 11px;
        background-position: center;
      }
    }

    .sliders {
      flex: 1;
      margin-left: 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 8px;

      .hue-line {
        background: linear-gradient(-90deg in hsl longer hue, red, red);
      }

      .opacity-line {

        .background {
          position: absolute;
          inset: -1px;
          border-radius: 3px;
          border-radius: 0;
        }

        &::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 7px;
          border: 4px solid var(--background-color, #fff);
        }
      }

      .slider {
        width: 100%;
        height: 11px;
        border-radius: 3px;
        position: relative;
        cursor: crosshair;

        .handle {
          position: absolute;
          left: 80%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;

          height: 15px;
          width: 15px;
          background-color: rgba(183, 183, 183, 0.6);
          border-radius: 50%;

          box-shadow: 0 2px 4px 1px rgba(0, 0, 0, 0.3);

          cursor: ew-resize;

          .handle-fill {
            position: absolute;
            inset: 1px;
            background-color: #373737;
            border-radius: 50%;
          }
        }
      }
    }
  }

  .hue-line {
    width: 100%;
    height: 10px;

    background: red;
  }

  .chess {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 10 10'%3E%3Cg class='chess' clip-path='url(%23a)'%3E%3Cpath fill='%23fff' d='M0 0h10v10H0z'/%3E%3Cpath fill='%23CCC' d='M0 0h5v5H0V0Zm5 5h5v5H5V5Z' class='Vector'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='a' class='a'%3E%3Cpath fill='%23fff' d='M0 0h10v10H0z'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E");
  }

  .value-input {
    margin-top: 10px;
    display: flex;
    align-items: center;

    .values {
      display: flex;
      flex: 1;
      gap: 5px;

      .input-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;

        input {
          border: 1px solid #828282;
          border-radius: 5px;
          text-align: center;
          padding: 3px 0;
          width: 100%;
          font-size: 13px;
          color: #e8e8e8;
          background-color: #0000002f;

          &:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }

          -moz-appearance: textfield;

          &::-webkit-outer-spin-button,
          &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        }

        span {
          font-size: 11px;
          color: #707070;
          margin-top: 6px;
          font-weight: bold;
          user-select: none;
          line-height: 1;
        }
      }
    }

    .change {
      background-color: transparent;
      border: none;
      cursor: pointer;
      padding: 5px;
      color: #adadad;
      border-radius: 5px;
      margin-right: -8px;
      margin-left: 8px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }

      svg {
        width: 12px;
        height: 12px;
        fill: currentColor;
        display: block;
      }
    }
  }

  .favorites {
    border-top: 1px solid #424242;
    margin: 0 -15px;
    margin-top: 5px;
    padding: 0 15px;
    padding-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 5.5px;

    .color {
      min-width: 15px;
      min-height: 15px;
      width: 15px;
      height: 15px;
      border-radius: 3px;
      position: relative;
      background-color: transparent;
      border: none;
      transition: transform 0.1s ease-in-out;

      &:hover {
        transform: scale(1.1);
      }

      &::after {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: 4px;
        border: 2px solid var(--background-color, #fff);
      }

      .layer {
        position: absolute;
        inset: 0;
        border-radius: 5px;
      }
    }

    .add {
      width: 19px;
      height: 19px;
      background-color: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #adadad;
      border-radius: 5px;
      margin: -2px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }

      svg {
        width: 100%;
        height: 100%;
        fill: currentColor;
        display: block;
      }
    }
  }
}
</style>

<style lang="scss">
body {
  &.color-picker-slider-move {
    user-select: none;
    cursor: ew-resize;
  }

  &.color-picker-handle-move {
    user-select: none;
    cursor: all-scroll;
  }
}
</style>