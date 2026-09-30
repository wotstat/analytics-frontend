<template>
  <DebugPage title="SeriesTooltip и палитра" description="Общие ряды tooltip и цвета без данных из БД."
    source="src/shared/ui/chart/SeriesTooltip.vue">
    <DebugSection title="Палитра рядов" id="series-colors"
      description="Первые десять цветов фиксированы, следующие генерируются тем же алгоритмом, что в сравнении техники."
      source="src/shared/ui/chart/seriesColors.ts">
      <div class="palette">
        <div v-for="color, index in colors" :key="index" class="swatch">
          <span class="color" :style="{ backgroundColor: color }"></span>
          <span>{{ index + 1 }} · {{ color }}</span>
        </div>
      </div>
    </DebugSection>

    <DebugSection title="Ряды и раскладка" id="series-tooltip"
      description="1–10 рядов — одна колонка, 11–20 — две, от 21 — три. Пропуски не показывают значение; ноль сохраняется."
      source="src/shared/ui/chart/SeriesTooltip.vue">
      <div class="debug-row">
        <label class="debug-control"><span class="debug-label">рядов</span>
          <select v-model.number="count" class="debug-select">
            <option v-for="size in [1, 10, 11, 20, 21, 40]" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
        <label class="debug-control"><span class="debug-label">длинные названия</span>
          <input v-model="longNames" type="checkbox">
        </label>
        <label class="debug-control"><span class="debug-label">пропуски</span>
          <input v-model="missing" type="checkbox">
        </label>
        <label class="debug-control"><span class="debug-label">подсвеченный ряд</span>
          <input v-model.number="highlighted" type="number" min="0" :max="count" class="debug-input">
        </label>
        <label class="debug-control"><span class="debug-label">заголовок</span>
          <input v-model="header" type="checkbox">
        </label>
      </div>
      <div class="card">
        <SeriesTooltip :items :format-value="formatValue">
          <template v-if="header" #header="{ columnCount, horizontal }">
            <b class="heading">Произвольный показатель</b>
            <span class="metadata" :class="{ horizontal }">Колонок: {{ columnCount }} · 30 сентября 2026</span>
          </template>
        </SeriesTooltip>
      </div>
      <p class="debug-note">Подсветка увеличивает только цветной маркер. При отключённом заголовке у списка нет верхнего зазора.</p>
    </DebugSection>

    <DebugSection title="Границы экрана" id="series-tooltip-edges"
      description="Та же карточка внутри обычного поповера: проверь все четыре угла, прокрутку и узкий экран."
      source="src/shared/ui/chart/SeriesTooltip.vue">
      <div class="edge-stage">
        <button v-for="corner in corners" :key="corner" class="debug-button edge-button" :class="corner"
          @click="openAt($event)">Tooltip</button>
      </div>
      <PopoverStyled :target :display="open" :placement="['top-float', 'bottom-float']" interactive>
        <SeriesTooltip :items :format-value="formatValue" />
      </PopoverStyled>
      <div class="debug-row"><button class="debug-button" @click="open = false">Закрыть</button></div>
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import SeriesTooltip from '@/shared/ui/chart/SeriesTooltip.vue'
import { seriesColor } from '@/shared/ui/chart/seriesColors'
import type { SeriesTooltipItem } from '@/shared/ui/chart/seriesTooltip'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'

const colors = Array.from({ length: 30 }, (_, index) => seriesColor(index))
const count = ref(11)
const longNames = ref(false)
const missing = ref(true)
const highlighted = ref(1)
const header = ref(true)
const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
const target = shallowRef<HTMLElement | null>(null)
const open = ref(false)

const items = computed<SeriesTooltipItem[]>(() => Array.from({ length: count.value }, (_, index) => ({
  tag: `source-${index}`,
  name: longNames.value ? `Источник ${index + 1} с очень длинным названием и НеразрывнойДлиннойПодписью` : `Источник ${index + 1}`,
  color: seriesColor(index),
  value: missing.value && index % 4 === 3 ? (index % 8 === 3 ? undefined : null) : index * 113,
  highlighted: index === highlighted.value - 1,
})))

function formatValue(value: number) {
  return value.toLocaleString('ru-RU')
}

function openAt(event: MouseEvent) {
  target.value = event.currentTarget as HTMLElement
  open.value = true
}
</script>

<style scoped lang="scss">
.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;

  .swatch {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .color {
    width: 14px;
    height: 14px;
    border-radius: 50%;
  }
}

.card {
  width: fit-content;
  border: 1px solid #ffffff20;
  border-radius: 8px;
  background: #1c1c1e;
}

.heading {
  color: white;
  overflow-wrap: anywhere;
}

.metadata {
  display: block;
  color: #ffffff80;
  min-width: 0;

  &.horizontal {
    margin-left: auto;
    text-align: right;
  }
}

.edge-stage {
  height: 240px;
  position: relative;
}

.edge-button {
  position: absolute;

  &.top-left { top: 0; left: 0; }
  &.top-right { top: 0; right: 0; }
  &.bottom-left { bottom: 0; left: 0; }
  &.bottom-right { bottom: 0; right: 0; }
}
</style>
