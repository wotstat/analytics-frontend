<template>
  <DebugSection title="Базовый Popover: placement, offset, preserveLastPlacement" id="base-placement"
    description="Крути placement — карточка обходит цель по кругу. offset отодвигает её от цели, viewportOffset сжимает границы, в которые она обязана вписаться. Сторона placement внутри карточки должна совпадать с тем, где карточка реально оказалась."
    source="src/shared/uiKit/popover/Popover.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">display</span>
        <input type="checkbox" v-model="display">
      </label>

      <PlacementSelect v-model="primary" label="placement" />
      <PlacementSelect v-model="fallback" label="+ фолбэк" allow-none />

      <label class="debug-control">
        <span class="debug-label">offset</span>
        <input type="range" min="0" max="40" v-model.number="offset">
        <span class="debug-value">{{ offset }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">viewportOffset</span>
        <input type="range" min="0" max="200" v-model.number="viewportOffset">
        <span class="debug-value">{{ viewportOffset }}</span>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">preserveLastPlacement</span>
        <input type="checkbox" v-model="preserveLastPlacement">
      </label>

      <label class="debug-control">
        <span class="debug-label">крупная карточка</span>
        <input type="checkbox" v-model="big">
      </label>

      <label class="debug-control">
        <span class="debug-label">рамка viewportOffset</span>
        <input type="checkbox" v-model="showViewportBox">
      </label>

      <span class="debug-hint">
        placement: <span class="debug-value">{{ JSON.stringify(placement) }}</span>
      </span>
    </div>

    <div class="debug-stage center tall">
      <button class="debug-btn" ref="target" @click="display = !display">цель</button>

      <Popover :target :display :offset :viewport-offset="viewportOffset" :placement
        :preserve-last-placement="preserveLastPlacement" v-slot="{ arrow }">
        <DemoCard :big>
          <div>содержимое поповера</div>
          <div class="value">сторона placement: {{ placementSideByArrow(arrow.direction) }}</div>
          <div class="value">стрелка: {{ arrow.direction ?? '—' }} @ {{ Math.round(arrow.x ?? 0) }},{{
            Math.round(arrow.y ?? 0) }}</div>
        </DemoCard>
      </Popover>
    </div>

    <ViewportBox :display="showViewportBox" :offset="viewportOffset" />

    <p class="debug-note">
      Список placement перебирается по порядку, побеждает первый, который целиком влез в границы.
      Модификатор <b>-float</b> разрешает карточке съезжать вдоль свободной оси, вместо того чтобы уходить за край:
      сравни <span class="debug-value">top</span> и <span class="debug-value">top-float</span> при большом
      viewportOffset.
      С <b>preserveLastPlacement</b> (по умолчанию true) прошлый удачный placement проверяется первым — карточка
      не дёргается туда-обратно, когда одинаково подходят два варианта. Выключи и потаскай окно по границе.
    </p>

    <p class="debug-note">
      Базовый <span class="debug-value">Popover</span> не рисует ничего своего и ставит контейнеру
      <span class="debug-value">pointer-events: none</span> — карточка тут своя, и мышь через неё проходит.
      Выбранный placement наружу не отдаётся: единственный признак — направление стрелки в слоте.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Popover from '@/shared/uiKit/popover/Popover.vue'
import { PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import DemoCard from '../shared/DemoCard.vue'
import PlacementSelect from '@/pages/debug/shared/PlacementSelect.vue'
import ViewportBox from '@/pages/debug/shared/ViewportBox.vue'
import { placementSideByArrow } from '../shared/arrowSide'

const target = useTemplateRef<HTMLElement>('target')

const display = ref(true)
const primary = ref<PlacementWithModifiers | null>('top')
const fallback = ref<PlacementWithModifiers | null>('bottom')
const offset = ref(8)
const viewportOffset = ref(10)
const preserveLastPlacement = ref(true)
const big = ref(false)
const showViewportBox = ref(false)

const placement = computed<PlacementWithModifiers[]>(() => {
  const list: PlacementWithModifiers[] = []
  if (primary.value) list.push(primary.value)
  if (fallback.value) list.push(fallback.value)
  return list.length > 0 ? list : ['top-float']
})

</script>
