<template>
  <DebugSection title="Границы viewport: перебор placement и автозакрытие" id="viewport-edges"
    description="Девять целей по краям сцены и один список placement на всех. Нажми «открыть все» и крути ползунок: сначала карточки переворачиваются, а когда не остаётся ни одного подходящего варианта — тултип закрывается сам."
    source="src/shared/uiKit/tooltip/TooltipRoot.vue">

    <div class="debug-row">
      <PlacementSelect v-model="primary" label="placement" />
      <PlacementSelect v-model="fallback" label="+ фолбэк" allow-none />

      <label class="debug-control">
        <span class="debug-label">границы = сцена</span>
        <input type="checkbox" v-model="boundsFromStage">
      </label>

      <label class="debug-control">
        <span class="debug-label">+ поджать на</span>
        <input type="range" min="0" max="300" v-model.number="extra">
        <span class="debug-value">{{ extra }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">рамка границ</span>
        <input type="checkbox" v-model="showViewportBox">
      </label>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="openAll">Открыть все</button>
      <button class="debug-btn" @click="closeAll">Закрыть все</button>

      <span class="debug-hint">
        placement: <span class="debug-value">{{ JSON.stringify(placement) }}</span>,
        viewportOffset: <span class="debug-value">{{ JSON.stringify(viewportOffset) }}</span>
      </span>
    </div>

    <div class="debug-stage edges" ref="stage">
      <EdgeTarget v-for="index in 9" :key="index" ref="targets" :label="`цель ${index}`" />
    </div>

    <ViewportBox :display="showViewportBox" :offset="viewportOffset" label="границы" />

    <EventLog :entries="entries" @clear="clear" title="Показы и закрытия"
      empty="Открой цели и поджимай границы — закрытия появятся здесь" />

    <p class="debug-note">
      В режиме «границы = сцена» <span class="debug-value">viewportOffset</span> каждый кадр считается как разница
      между <span class="debug-value">getViewportRect()</span> и прямоугольником сцены, поэтому пунктирная рамка сцены
      — это буквально та граница, по которой идёт перебор. Верхний ряд должен смотреть вниз, нижний — вверх, боковые —
      к центру. Сними галочку, чтобы вернуться к настоящему вьюпорту: тогда флип надо вызывать по-честному — сузить
      окно или прокрутить страницу так, чтобы сцена упёрлась в край.
    </p>

    <p class="debug-note">
      Ключевое отличие от <span class="debug-value">Popover</span>: тот, не найдя подходящего placement, просто
      остаётся на последнем и вылезает за край. Тултип в этой ситуации <b>закрывается</b> —
      <span class="debug-value">TooltipRoot</span> ловит <span class="debug-value">popoverOutsideWindow</span> и зовёт
      <span class="debug-value">closeTooltip</span>. Условие именно «сам поповер не поместился с учётом
      viewportOffset», а не «цель ушла за экран»: <span class="debug-value">targetOutsideWindow</span> и
      <span class="debug-value">popoverFullyOutsideWindow</span> тултип не слушает вообще.
    </p>

    <p class="debug-note">
      Поджимай ползунок по одному шагу и смотри в лог: у части целей закрытие происходит раньше, чем у остальных, —
      это и есть момент, когда для конкретной цели не осталось ни одного подходящего варианта. Если оставить один
      placement без <span class="debug-value">-float</span>, закрытий будет заметно больше: без float карточке некуда
      сползать вдоль свободной оси.
    </p>

    <p class="debug-note">
      Ещё одна проверка того же условия: открой одну цель и прокрути страницу так, чтобы сцена уехала за край окна —
      тултип закроется сам, потому что поповер вместе с целью перестал помещаться в границы. Открытых тултипов лучше
      не оставлять много: каждый пересчитывает позицию раз в кадр.
    </p>

    <p class="debug-note">
      Пальцем: ресайза окна нет, поэтому открывай цели тапом и поджимай границы ползунком; тултип должен закрыться
      сам, без тапа вне цели. Границы берутся из <span class="debug-value">visualViewport</span>, так что пинч-зум и
      сворачивание адресной строки тоже участвуют.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef, watchEffect } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import type { OffsetValue, PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import PlacementSelect from '@/pages/debug/shared/PlacementSelect.vue'
import ViewportBox from '@/pages/debug/shared/ViewportBox.vue'
import EventLog from '@/pages/debug/shared/EventLog.vue'
import { closeByPointer, openByPointer } from '../../shared/pointerSimulation'
import { useDisplayedTooltipsLog } from '../../shared/useDisplayedTooltipsLog'
import { useStageViewportOffset } from '@/pages/debug/shared/useStageViewportOffset'
import EdgeTarget from './EdgeTarget.vue'
import { placement, viewportOffset } from './edgeTooltip'

const primary = ref<PlacementWithModifiers | null>('top-float')
const fallback = ref<PlacementWithModifiers | null>('bottom-float')
const boundsFromStage = ref(true)
const extra = ref(0)
const showViewportBox = ref(false)

const stage = useTemplateRef<HTMLElement>('stage')
const targets = useTemplateRef<InstanceType<typeof EdgeTarget>[]>('targets')

const { entries, clear } = useDisplayedTooltipsLog()

const stageOffset = useStageViewportOffset(stage, boundsFromStage, extra)
const effectiveOffset = computed<OffsetValue>(() => boundsFromStage.value ? stageOffset.value : extra.value)

// Контролы секции живут здесь, а директива — в модуле: связываем их одним эффектом.
watchEffect(() => {
  const list: PlacementWithModifiers[] = []
  if (primary.value) list.push(primary.value)
  if (fallback.value) list.push(fallback.value)

  placement.value = list.length > 0 ? list : ['top-float']
})

watchEffect(() => viewportOffset.value = effectiveOffset.value)

function openAll() {
  for (const target of targets.value ?? []) openByPointer(target.$el)
}

function closeAll() {
  for (const target of targets.value ?? []) closeByPointer(target.$el)
}

</script>
