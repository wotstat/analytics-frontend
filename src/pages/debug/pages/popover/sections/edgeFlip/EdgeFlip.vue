<template>
  <DebugSection title="Флип у краёв viewport" id="edge-flip"
    description="Девять целей по краям сцены и один общий placement на всех. У целей, которым не хватает места, поповер обязан перевернуться на противоположную сторону или поджаться — а не уехать за край экрана."
    source="src/shared/uiKit/popover/utils.ts">

    <div class="debug-row">
      <PlacementSelect v-model="primary" label="placement" />
      <PlacementSelect v-model="fallback" label="+ фолбэк" allow-none />

      <label class="debug-control">
        <span class="debug-label">границы = сцена</span>
        <input type="checkbox" v-model="boundsFromStage">
      </label>

      <label class="debug-control">
        <span class="debug-label">viewportOffset</span>
        <input type="range" min="0" max="250" v-model.number="viewportOffset" :disabled="boundsFromStage">
        <span class="debug-value">{{ boundsFromStage ? '—' : viewportOffset }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">рамка границ</span>
        <input type="checkbox" v-model="showViewportBox">
      </label>

      <button class="debug-btn" @click="setAll(true)">Показать все</button>
      <button class="debug-btn" @click="setAll(false)">Скрыть все</button>
    </div>

    <p class="debug-hint">
      placement: <span class="debug-value">{{ JSON.stringify(placement) }}</span> — по кнопке-цели можно погасить
      отдельный поповер, чтобы он не мешал смотреть соседний.
    </p>

    <div class="debug-stage edges" ref="stage">
      <EdgeTarget v-for="(_, index) in open" :key="index" :label="`${index + 1}`" :display="open[index]"
        :placement="placement" :viewport-offset="effectiveOffset" @toggle="open[index] = !open[index]" />
    </div>

    <ViewportBox :display="showViewportBox" :offset="effectiveOffset" />

    <p class="debug-note">
      По умолчанию границы совпадают со сценой: <span class="debug-value">viewportOffset</span> каждый кадр считается
      как разница между <span class="debug-value">getViewportRect()</span> и прямоугольником сцены. Поэтому пунктирная
      рамка сцены — это буквально та граница, по которой идёт флип, и все направления видно сразу: у целей верхнего ряда
      места сверху нет, значит они должны смотреть вниз, у нижнего — наоборот, у боковых — в сторону центра.
    </p>

    <p class="debug-note">
      Сними галочку «границы = сцена», чтобы вернуться к настоящему вьюпорту — тогда флип надо вызывать по-честному:
      прокрутить страницу так, чтобы сцена упёрлась в край окна, сузить окно по ширине или сжать область ползунком
      viewportOffset. Учти, что при больших значениях ползунка цель может целиком оказаться за границей — тогда ни один
      placement не подходит и поповер остаётся на первом, см. врезку ниже.
    </p>

    <p class="debug-note">
      Режим «границы = сцена» удобен, но он сокращает вклад <span class="debug-value">visualViewport</span>: пинч-зум,
      клавиатура и сворачивание тулбара двигают обе стороны вычитания одинаково и потому перестают влиять на результат.
      Проверять поведение самих границ надо в режиме настоящего вьюпорта — здесь и в секции про события.
    </p>

    <p class="debug-note">
      Если не подошёл ни один placement из списка, поповер остаётся на последнем и вылезает за границу — это не
      поломка, а честный «не поместился»: в этот момент летит событие
      <span class="debug-value">popoverOutsideWindow</span> (см. секцию про события).
    </p>

    <p class="debug-note">
      Пальцем: ресайза окна нет, поэтому сними «границы = сцена», тяни viewportOffset и прокручивай страницу. Границы
      берутся из <span class="debug-value">visualViewport</span>, так что пинч-зум и сворачивание адресной строки тоже
      двигают их — поповеры должны переехать сами, без тапов.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { OffsetValue, PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import EdgeTarget from './EdgeTarget.vue'
import PlacementSelect from '@/pages/debug/shared/PlacementSelect.vue'
import ViewportBox from '@/pages/debug/shared/ViewportBox.vue'
import { useStageViewportOffset } from '@/pages/debug/shared/useStageViewportOffset'

const primary = ref<PlacementWithModifiers | null>('top-float')
const fallback = ref<PlacementWithModifiers | null>('bottom-float')
const viewportOffset = ref(10)
const showViewportBox = ref(false)
const boundsFromStage = ref(true)
const open = ref<boolean[]>(new Array(9).fill(true))

const stage = useTemplateRef<HTMLElement>('stage')
const stageOffset = useStageViewportOffset(stage, boundsFromStage)

const effectiveOffset = computed<OffsetValue>(() => boundsFromStage.value ? stageOffset.value : viewportOffset.value)

const placement = computed<PlacementWithModifiers[]>(() => {
  const list: PlacementWithModifiers[] = []
  if (primary.value) list.push(primary.value)
  if (fallback.value) list.push(fallback.value)
  return list.length > 0 ? list : ['top-float']
})

function setAll(value: boolean) {
  open.value = open.value.map(() => value)
}

</script>
