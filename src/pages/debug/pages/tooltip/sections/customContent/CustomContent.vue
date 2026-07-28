<template>
  <DebugSection title="defineTooltip: произвольное содержимое" id="define-tooltip"
    description="Пара «DefineTooltip + vTooltipTarget» на один компонент: шаблон карточки лежит в том же файле, что и цель, и видит его состояние. Параметры задаются пропами DefineTooltip — они реактивные, у открытого тултипа применяются сразу."
    source="src/shared/uiKit/tooltip/tooltip.ts">

    <div class="debug-row">
      <PlacementSelect v-model="placement" allow-none />

      <label class="debug-control">
        <span class="debug-label">offset</span>
        <input type="range" min="0" max="30" v-model.number="offset">
        <span class="debug-value">{{ offset }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">arrowSize</span>
        <input type="range" min="0" max="16" v-model.number="arrowSize">
        <span class="debug-value">{{ arrowSize }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">class</span>
        <select v-model="cardClass">
          <option v-for="variant in cardClasses" :key="variant.value" :value="variant.value">{{ variant.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="openByPointer(plainTarget)">Открыть первую программно</button>
      <button class="debug-btn" @click="closeByPointer(plainTarget)">Закрыть</button>

      <label class="debug-control">
        <span class="debug-label">убрать DefineTooltip из дерева</span>
        <input type="checkbox" v-model="definitionRemoved">
      </label>

      <span class="debug-hint">нажатий на кнопку внутри карточки: <span class="debug-value">{{ clicks }}</span></span>
    </div>

    <div class="debug-stage center short">
      <div class="debug-row">
        <button class="debug-btn" ref="plainTarget" v-tooltip-target.instant="{ label: 'обычная цель', battles: 1234 }">
          обычная
        </button>

        <button class="debug-btn" v-tooltip-target.instant.interactive="{ label: 'интерактивная цель', battles: 42 }">
          .interactive
        </button>
      </div>

      <DefineTooltip v-if="!definitionRemoved" :placement="placementValue" :offset :arrow-size="arrowSize"
        :viewport-offset="popoverViewportOffset" :class="cardClass || undefined" v-slot="payload">
        <div class="card">
          <div class="head">{{ payload.label }}</div>
          <table>
            <tr>
              <td>боёв</td>
              <td class="mono">{{ payload.battles }}</td>
            </tr>
            <tr>
              <td>offset</td>
              <td class="mono">{{ offset }}</td>
            </tr>
          </table>
          <button class="inner-btn" @click="clicks++">кнопка внутри карточки</button>
        </div>
      </DefineTooltip>
    </div>

    <p class="debug-note">
      Кнопка внутри карточки нажимается только у цели с <span class="debug-value">.interactive</span> — у обычной
      карточки <span class="debug-value">pointer-events: none</span>, клик уходит на страницу под ней. Счётчик
      нажатий это и показывает.
    </p>

    <p class="debug-note">
      Пропы <span class="debug-value">DefineTooltip</span> читаются через геттеры, поэтому крутить placement,
      offset, arrowSize и class можно на уже открытом тултипе: открой первую цель программно и подвигай ползунки —
      карточка переезжает, содержимое не пересоздаётся.
    </p>

    <p class="debug-note">
      <b>Тумблер «убрать DefineTooltip»</b> ломает нарочно. Регистрация живёт в
      <span class="debug-value">setup</span> компонента <span class="debug-value">DefineTooltip</span>, снятие с
      дерева её удаляет — и наведение на цель падает с
      <span class="debug-value">Error: Tooltip definition not found</span> в консоли. Отсюда правило: DefineTooltip
      должен быть смонтирован всё время, пока директива жива, и его нельзя прятать под тем же
      <span class="debug-value">v-if</span>, что и содержимое.
    </p>

    <div class="debug-col">
      <span class="debug-label">Ловушка: одна defineTooltip() на модуль и три экземпляра компонента</span>

      <div class="debug-stage short">
        <div class="debug-row">
          <SharedItem v-for="label in sharedItems" :key="label" :label="label" />
        </div>
      </div>

      <div class="debug-row">
        <button class="debug-btn" @click="dropLastSharedItem" :disabled="sharedItems.length === 0">
          Удалить последний
        </button>
        <button class="debug-btn" @click="restoreSharedItems">Вернуть все</button>
      </div>
    </div>

    <p class="debug-note">
      Наведись на «шаблон 1»: значение биндинга придёт правильное, а вот <b>шаблон</b> будет от последнего
      смонтированного экземпляра. Причина — <span class="debug-value">defineTooltip()</span> вызвана на уровне
      модуля, значит <span class="debug-value">tooltipId</span> один на всех, и каждый новый
      <span class="debug-value">DefineTooltip</span> перезаписывает регистрацию предыдущего. Нажми «Удалить
      последний» — <span class="debug-value">onScopeDispose</span> снесёт общую регистрацию, и остальные две цели
      начнут падать с <span class="debug-value">Tooltip definition not found</span>.
      Вывод: <span class="debug-value">defineTooltip()</span> вызывают внутри
      <span class="debug-value">setup</span> (как в Item.vue онслота), а на уровне модуля живёт только
      <span class="debug-value">useTooltip</span> — у него регистрация одна и содержимое приходит из значения.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { defineTooltip } from '@/shared/uiKit/tooltip/tooltip'
import { PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import PlacementSelect from '@/pages/debug/shared/PlacementSelect.vue'
import { cardClasses, type CardClass } from '../../shared/cardClasses'
import { closeByPointer, openByPointer } from '../../shared/pointerSimulation'
import SharedItem from './SharedItem.vue'

type Payload = {
  label: string
  battles: number
}

const { DefineTooltip, vTooltipTarget } = defineTooltip<Payload>()

const placement = ref<PlacementWithModifiers | null>('top-float')
const offset = ref(8)
const arrowSize = ref(7)
const cardClass = ref<CardClass>('')
const definitionRemoved = ref(false)
const clicks = ref(0)

const allSharedItems = ['шаблон 1', 'шаблон 2', 'шаблон 3']
const sharedItems = ref([...allSharedItems])

const plainTarget = useTemplateRef<HTMLElement>('plainTarget')

const placementValue = computed(() => placement.value ?? undefined)

function dropLastSharedItem() {
  sharedItems.value = sharedItems.value.slice(0, -1)
}

function restoreSharedItems() {
  sharedItems.value = [...allSharedItems]
}

</script>


<style scoped lang="scss">
.card {
  padding: 7px 9px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .head {
    font-weight: var(--bold-weight);
  }

  table {
    border-collapse: collapse;

    td {
      padding: 0 0.6em 0 0;
      color: #ffffffb0;
    }

    .mono {
      font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
      font-variant-numeric: tabular-nums;
      color: var(--font-color);
    }
  }

  .inner-btn {
    align-self: flex-start;
    background: #ffffff14;
    border: 1px solid #ffffff30;
    border-radius: 4px;
    color: inherit;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    padding: 0.2em 0.5em;
  }
}
</style>
