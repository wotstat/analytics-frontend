<template>
  <DebugSection title="Селектор режимов боя" id="battle-mode"
    description="Общий справочник режимов и геймплеев с подгрузкой новых сочетаний при открытии."
    source="src/shared/game/selectors/battleMode/BattleModeSelector.vue">

    <div class="debug-row">
      <button class="debug-btn" @click="selected = []">Все режимы</button>
      <button class="debug-btn" @click="selected = ['COMP7']">Натиск</button>
      <button class="debug-btn" @click="selected = ['REGULAR', 'COMP7', 'TRAINING']">Три режима</button>
      <span class="debug-label">Модель:</span>
      <span class="debug-value">{{ selected.length ? selected.join(', ') : 'без ограничения' }}</span>
    </div>

    <div class="debug-stage">
      <span class="debug-label">Переключатель Lesta/WG, приоритет одиночного</span>
      <BattleModeSelector v-model="selected" />
    </div>

    <div class="debug-row">
      <button class="debug-btn" @click="forcedRegions = ['RU']">RU</button>
      <button class="debug-btn" @click="forcedRegions = ['EU']">EU</button>
      <button class="debug-btn" @click="forcedRegions = ['CN']">CN</button>
      <button class="debug-btn" @click="forcedRegions = ['RU', 'EU']">RU + EU</button>
      <span class="debug-label">Заданы регионы: {{ forcedRegions.join(', ') }}</span>
    </div>

    <div class="debug-stage">
      <span class="debug-label">Приоритет множественного, регионы извне</span>
      <BattleModeSelector v-model="multipleSelected" :regions="forcedRegions"
        selection-priority="multiple" />
      <span class="debug-value">{{ multipleSelected.join(', ') || 'без ограничения' }}</span>
    </div>

    <div class="debug-stage">
      <span class="debug-label">Только одиночный выбор, игра задана извне</span>
      <BattleModeSelector v-model="singleSelected" game="wot" :multiple="false" />
      <span class="debug-value">{{ singleSelected.join(', ') }}</span>
    </div>

    <p class="debug-note">
      В первом примере обычный клик выбирает один режим и закрывает панель, Ctrl/⌘/Shift добавляет или снимает режим.
      Во втором обычный клик меняет множественный выбор и оставляет панель открытой; переключателя игры нет.
      RU и CT показывают режимы Lesta, EU и CN — режимы WG: отсутствие боёв в конкретном регионе не скрывает режим.
      Смена игры сохраняет выбранные режимы.
      Галочка в шапке добавляет архивные пункты в те же категории. В WG у случайных боёв подменю появляется только с архивными.
      Три точки справа открывают одно компактное подменю. Режимы и геймплеи тренировочных собраны в нём по секциям;
      выбор геймплея выделяет и родительскую плитку, и три точки. Полигон находится в Основных.
      В третьем примере модификаторы не включают множественный выбор.
    </p>
  </DebugSection>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import BattleModeSelector from '@/shared/game/selectors/battleMode/BattleModeSelector.vue'
import { type BattleModeSelectionKey } from '@/shared/game/selectors/battleMode/catalog'
import type { GameRegion } from '@/shared/game/wot'

const selected = ref<BattleModeSelectionKey[]>(['@regular'])
const multipleSelected = ref<BattleModeSelectionKey[]>(['@regular'])
const singleSelected = ref<BattleModeSelectionKey[]>(['@regular'])
const forcedRegions = ref<GameRegion[]>(['RU'])
</script>
