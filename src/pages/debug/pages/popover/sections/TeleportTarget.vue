<template>
  <DebugSection title="teleportTo: общий #popover-root, свой контейнер, рендер на месте" id="teleport-to"
    description="По умолчанию поповер уезжает в общий #popover-root в конце body. null рендерит его на месте, строка или элемент — в свой контейнер. Во всех трёх случаях карточка обязана оказаться в одной и той же точке относительно цели."
    source="src/shared/uiKit/popover/popoverRoot.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">display</span>
        <input type="checkbox" v-model="display">
      </label>

      <label class="debug-control">
        <span class="debug-label">teleportTo</span>
        <select v-model="mode">
          <option value="root">по умолчанию (#popover-root)</option>
          <option value="inplace">null — на месте</option>
          <option value="custom">свой контейнер</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">испортить контейнер</span>
        <select v-model="damage">
          <option value="none">ничего</option>
          <option value="relative">position: relative</option>
          <option value="transform">transform: translateZ(0)</option>
          <option value="overflow">overflow: hidden</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">сломать #popover-root</span>
        <input type="checkbox" v-model="damageRoot">
      </label>
    </div>

    <p class="debug-hint">
      сейчас передаётся: <span class="debug-value">{{ passedValue }}</span>
    </p>

    <div class="debug-stage center short">
      <button class="debug-btn" ref="target" @click="display = !display">цель</button>
    </div>

    <p class="debug-hint">Свой контейнер для teleportTo (в DevTools карточка должна лежать внутри него):</p>
    <div class="host custom-host" :class="damageClass" ref="custom">
      <span class="debug-hint">свой контейнер</span>
    </div>

    <p class="debug-hint">Место в разметке, куда попадёт поповер при teleportTo = null:</p>
    <div class="host inplace-host" :class="damageClass">
      <span class="debug-hint">хост для рендера на месте</span>

      <Popover :target :display :teleport-to="teleportTo" :offset="8" :placement="['top', 'bottom']" v-slot="{ arrow }">
        <DemoCard>
          <div>teleportTo: {{ passedValue }}</div>
          <div class="value">сторона: {{ placementSideByArrow(arrow.direction) }}</div>
        </DemoCard>
      </Popover>
    </div>

    <p class="debug-note">
      Контейнер-цель обязан быть «чистым»: без <span class="debug-value">position</span> (кроме static) и без
      <span class="debug-value">transform</span>/<span class="debug-value">filter</span>. Контейнер поповера
      позиционируется как <span class="debug-value">position: absolute</span> с координатами относительно страницы,
      поэтому любой такой контейнер становится containing block — и карточка уезжает ровно на смещение контейнера.
      Выбери «свой контейнер» или «на месте» и переключи «испортить контейнер» в
      <span class="debug-value">position: relative</span>: карточка должна прыгнуть вниз-вправо, это и есть поломка.
      <span class="debug-value">overflow: hidden</span> ломает иначе — карточку обрезает контейнер.
    </p>

    <p class="debug-note">
      Галочка «сломать #popover-root» вешает transform на общий контейнер, поэтому уедут все поповеры на странице,
      включая тултипы других секций — так и должно быть, это демонстрация того, почему на нём ничего не должно висеть.
      При уходе со страницы стиль снимается сам.
    </p>

    <p class="debug-note">
      Ещё одно: <span class="debug-value">#popover-root</span> создаётся лениво при первом показе поповера и живёт
      прямо в body, то есть вне разметки страницы. Из-за этого до содержимого поповера не достают ни классы,
      завязанные на предков (тут это <span class="debug-value">.debug-*</span>), ни overflow/z-index родителей —
      но scoped-стили работают, потому что слот компилируется в области видимости своего компонента.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Popover from '@/shared/uiKit/popover/Popover.vue'
import { getPopoverRoot } from '@/shared/uiKit/popover/popoverRoot'
import DemoCard from '../shared/DemoCard.vue'
import { placementSideByArrow } from '../shared/arrowSide'

const target = useTemplateRef<HTMLElement>('target')
const custom = useTemplateRef<HTMLElement>('custom')

const display = ref(true)
const mode = ref<'root' | 'inplace' | 'custom'>('root')
const damage = ref<'none' | 'relative' | 'transform' | 'overflow'>('none')
const damageRoot = ref(false)

const teleportTo = computed(() => {
  if (mode.value === 'inplace') return null
  if (mode.value === 'custom') return custom.value ?? undefined
  return undefined
})

const passedValue = computed(() => {
  if (mode.value === 'inplace') return 'null'
  if (mode.value === 'custom') return 'HTMLElement (свой контейнер)'
  return 'undefined → #popover-root'
})

const damageClass = computed(() => damage.value === 'none' ? undefined : `damage-${damage.value}`)

watch(damageRoot, damaged => {
  getPopoverRoot().style.transform = damaged ? 'translateZ(0)' : ''
})

onUnmounted(() => {
  getPopoverRoot().style.transform = ''
})

</script>


<style scoped lang="scss">
.host {
  border: 1px dashed var(--debug-border-strong);
  border-radius: 6px;
  padding: 0.6em;
  min-height: 3em;

  &.damage-relative {
    position: relative;
  }

  &.damage-transform {
    transform: translateZ(0);
  }

  &.damage-overflow {
    overflow: hidden;
  }
}
</style>
