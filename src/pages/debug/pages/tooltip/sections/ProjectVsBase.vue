<template>
  <DebugSection title="Проектная обёртка и базовая директива" id="project-vs-base"
    description="Обе директивы — одна и та же реализация. Отличие ровно одно: проектная подставляет viewportOffset из шапки сайта, если его нет в значении. Нажми «прокрутить под шапку» и наведись на каждую цель: базовый тултип наедет на шапку, проектный отожмётся вниз."
    source="src/shared/ui/tooltip/textTooltip.ts">

    <div class="debug-row">
      <PlacementSelect v-model="placement" />

      <label class="debug-control">
        <span class="debug-label">additionalHeaderHeight</span>
        <input type="range" min="0" max="120" v-model.number="additionalHeaderHeight">
        <span class="debug-value">{{ additionalHeaderHeight }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">рамка popoverViewportOffset</span>
        <input type="checkbox" v-model="showViewportBox">
      </label>

      <button class="debug-btn" @click="scrollUnderHeader">Прокрутить под шапку</button>
    </div>

    <p class="debug-hint">
      headerHeight <span class="debug-value">{{ Math.round(headerHeight) }}</span> +
      additionalHeaderHeight <span class="debug-value">{{ additionalHeaderHeight }}</span> →
      popoverViewportOffset <span class="debug-value">{{ JSON.stringify(popoverViewportOffset) }}</span>.
      Базовая директива своего viewportOffset не задаёт, поэтому работает дефолт
      <span class="debug-value">PopoverStyled</span> — 10 со всех сторон.
    </p>

    <div class="debug-stage short">
      <div class="debug-row">
        <button class="debug-btn" ref="projectTarget"
          v-text-tooltip="{ text: 'Проектная: viewportOffset из шапки', placement: placementValue }">
          v-text-tooltip
        </button>

        <button class="debug-btn"
          v-base-tooltip="{ text: 'Базовая: viewportOffset по умолчанию 10', placement: placementValue }">
          v-base-tooltip
        </button>

        <button class="debug-btn" v-base-tooltip="{
          text: 'Базовая + свой viewportOffset — ведёт себя как проектная',
          placement: placementValue,
          viewportOffset: popoverViewportOffset,
        }">
          v-base-tooltip + viewportOffset
        </button>
      </div>
    </div>

    <ViewportBox :display="showViewportBox" :offset="popoverViewportOffset" label="popoverViewportOffset" />

    <p class="debug-note">
      Шапка сайта — <span class="debug-value">position: fixed</span> с z-index 100, а контейнер тултипов —
      1100. Поэтому «наехал на шапку» выглядит как тултип поверх шапки, а не спрятанный под ней: тултип не
      исчезает, он просто оказывается не там, где его ждут. От этого обёртка и защищает.
    </p>

    <p class="debug-note">
      Глобально в <span class="debug-value">main.ts</span> зарегистрирована именно проектная обёртка, поэтому
      на боевых страницах пишут <span class="debug-value">v-tooltip</span> и получают её. На этой странице обе
      директивы импортированы локально под разными именами
      (<span class="debug-value">v-text-tooltip</span> и <span class="debug-value">v-base-tooltip</span>) —
      иначе локальная перекрыла бы глобальную и сравнивать было бы нечего. Базовая нужна там, где проектной
      шапки нет: виджеты, поддомены, компоненты внутри <span class="debug-value">uiKit</span>, которым нельзя
      зависеть от страниц.
    </p>

    <p class="debug-note">
      Обёртка подставляет значение только если в значении его нет:
      <span class="debug-value">viewportOffset ?? popoverViewportOffset</span>. Свой
      <span class="debug-value">viewportOffset: 0</span> в значении отключит защиту от шапки целиком — это не
      баг, а приоритет значения над дефолтом.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { vTextTooltip } from '@/shared/ui/tooltip/textTooltip'
import { vTooltip as vBaseTooltip } from '@/shared/uiKit/tooltip/textTooltip/textTooltip'
import { PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import {
  headerHeight,
  headerOffset,
  popoverViewportOffset,
  useAdditionalHeaderHeight
} from '@/pages/shared/header/useAdditionalHeaderHeight'
import PlacementSelect from '@/pages/debug/shared/PlacementSelect.vue'
import ViewportBox from '@/pages/debug/shared/ViewportBox.vue'

const placement = ref<PlacementWithModifiers | null>('top')
const showViewportBox = ref(false)

// Пустой placement в значении надо не передавать вовсе — undefined из значения отфильтруется.
const placementValue = computed(() => placement.value ?? undefined)

// Тот же ref, которым страницы с липким подзаголовком расширяют границу. Сбросится при уходе со страницы.
const { additionalHeaderHeight } = useAdditionalHeaderHeight()

const projectTarget = useTemplateRef<HTMLElement>('projectTarget')

function scrollUnderHeader() {
  const el = projectTarget.value
  if (!el) return

  window.scrollBy({ top: el.getBoundingClientRect().top - headerOffset.value - 6, behavior: 'smooth' })
}

</script>
