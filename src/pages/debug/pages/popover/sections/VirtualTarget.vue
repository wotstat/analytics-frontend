<template>
  <DebugSection title="Виртуальная цель (VirtualElement)" id="virtual-target"
    description="Цель без DOM-элемента: объект с одним getBoundingClientRect(), который поповер опрашивает каждый кадр. Так к поповеру цепляется тултип точки данных на графике. Проверяем, что карточка держится за точку и переворачивается у краёв так же, как у обычной цели."
    source="src/shared/uiKit/popover/utils.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">display</span>
        <input type="checkbox" v-model="display">
      </label>

      <label class="debug-control">
        <span class="debug-label">режим</span>
        <select v-model="mode">
          <option value="point">точка на сцене</option>
          <option value="rect">прямоугольник на сцене</option>
          <option value="cursor">курсор</option>
        </select>
      </label>

      <PlacementSelect v-model="placement" label="placement" />

      <label class="debug-control" v-if="mode === 'rect'">
        <span class="debug-label">ширина</span>
        <input type="range" min="0" max="220" v-model.number="width">
        <span class="debug-value">{{ width }}</span>
      </label>

      <label class="debug-control" v-if="mode === 'rect'">
        <span class="debug-label">высота</span>
        <input type="range" min="0" max="160" v-model.number="height">
        <span class="debug-value">{{ height }}</span>
      </label>
    </div>

    <p class="debug-hint" v-if="mode === 'cursor'">
      Курсор: <span class="debug-value">{{ Math.round(cursorX) }}, {{ Math.round(cursorY) }}</span>
      (клиентские координаты) — карточка едет за мышью по всей странице, снять галочку display, чтобы остановить.
    </p>
    <p class="debug-hint" v-else>
      Точка относительно сцены: <span class="debug-value">{{ point.x }}, {{ point.y }}</span>, размер
      <span class="debug-value">{{ mode === 'rect' ? width : 0 }}×{{ mode === 'rect' ? height : 0 }}</span> — щёлкни по
      сцене, чтобы перенести точку.
    </p>

    <div class="debug-stage tall virtual-stage" ref="stage" @click="onStageClick">
      <div class="virtual-marker" :style="markerStyle" v-if="mode !== 'cursor'"></div>
    </div>

    <PopoverStyled :target="virtualTarget" :display="display" :placement="placement ?? 'top-float'" :arrow-size="6"
      :interactive="false">
      <div class="card-body">
        <div>виртуальная цель</div>
        <div class="hint">{{ modeTitle }}</div>
      </div>
    </PopoverStyled>

    <p class="debug-note">
      Координаты возвращаются <b>клиентские</b> (как у настоящего getBoundingClientRect), поэтому при скролле страницы
      их надо пересчитывать — в режиме точки они считаются от сцены, и карточка обязана остаться на месте, пока
      страница едет. Объект-цель создаётся один раз и читает актуальное состояние внутри метода: поповер опрашивает
      его каждый кадр, менять сам объект не нужно.
    </p>

    <p class="debug-note">
      У виртуальной цели нет DOM-узла, поэтому проверка «клик внутри цели» для неё всегда ложна: любой клик, включая
      клик по самому якорю, считается кликом «вне». Именно поэтому тултипы графика делают карточку
      <span class="debug-value">interactive: false</span> и не завязываются на автозакрытие по указателю.
    </p>

    <p class="debug-note">
      Пальцем: режим «курсор» слушает и касания — проведи пальцем по странице, карточка должна ехать за пальцем и
      переворачиваться у краёв. Режим «точка» ставится тапом по сцене.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useMouse } from '@vueuse/core'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'
import { PlacementWithModifiers, TargetRect, VirtualElement } from '@/shared/uiKit/popover/utils'
import PlacementSelect from '@/pages/debug/shared/PlacementSelect.vue'

const stage = useTemplateRef<HTMLElement>('stage')

const display = ref(true)
const mode = ref<'point' | 'rect' | 'cursor'>('point')
const placement = ref<PlacementWithModifiers | null>('top-float')
const point = ref({ x: 160, y: 120 })
const width = ref(120)
const height = ref(60)

const { x: cursorX, y: cursorY } = useMouse({ type: 'client' })

const modeTitle = computed(() => {
  if (mode.value === 'cursor') return 'привязка к курсору'
  if (mode.value === 'rect') return `привязка к прямоугольнику ${width.value}×${height.value}`
  return 'привязка к точке'
})

const virtualTarget: VirtualElement = {
  getBoundingClientRect(): TargetRect {
    if (mode.value === 'cursor') return { x: cursorX.value, y: cursorY.value, width: 0, height: 0 }

    const stageRect = stage.value?.getBoundingClientRect()
    if (!stageRect) return { x: 0, y: 0, width: 0, height: 0 }

    const size = mode.value === 'rect' ? { width: width.value, height: height.value } : { width: 0, height: 0 }
    return { x: stageRect.left + point.value.x, y: stageRect.top + point.value.y, ...size }
  }
}

const markerStyle = computed(() => ({
  left: `${point.value.x}px`,
  top: `${point.value.y}px`,
  width: mode.value === 'rect' ? `${width.value}px` : '0px',
  height: mode.value === 'rect' ? `${height.value}px` : '0px',
}))

function onStageClick(event: MouseEvent) {
  const stageRect = stage.value?.getBoundingClientRect()
  if (!stageRect) return

  point.value = {
    x: Math.round(event.clientX - stageRect.left),
    y: Math.round(event.clientY - stageRect.top),
  }
}

</script>


<style scoped lang="scss">
.virtual-stage {
  cursor: crosshair;
}

.virtual-marker {
  position: absolute;
  border: 1px dashed var(--blue-color);
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    left: -3px;
    top: -3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--blue-color);
  }
}

.card-body {
  padding: 0.5em 0.7em;
  font-size: 13px;
  line-height: 1.4;

  .hint {
    font-size: 11px;
    color: #ffffff80;
  }
}
</style>
