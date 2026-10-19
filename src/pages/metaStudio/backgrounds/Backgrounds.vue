<template>
  <section class="backgrounds">
    <header class="page-heading">
      <h1>Фоны мета-карточек</h1>
      <p>Сохранённые фоны и паттерны. Нажмите на вариант, чтобы рассмотреть его крупнее.</p>
    </header>

    <div class="preview-controls">
      <label>
        <span>Пример</span>
        <select v-model="example">
          <option value="general">Общая карточка</option>
          <option value="statistics">Статистика игрока</option>
        </select>
      </label>
      <template v-if="example === 'statistics'">
        <label>
          <input v-model="contentFull" type="checkbox">
          <span>Контент на всю высоту</span>
        </label>
        <label>
          <input v-model="headerDivider" type="checkbox">
          <span>Разделитель под шапкой</span>
        </label>
        <label>
          <input v-model="footerDivider" type="checkbox">
          <span>Разделитель над подвалом</span>
        </label>
      </template>
      <label>
        <span>Формат</span>
        <select v-model="format">
          <option value="og">Open Graph</option>
          <option value="twitter">X / Twitter</option>
        </select>
      </label>
      <label v-if="selected.supportsPattern !== false">
        <span>Паттерн</span>
        <select v-model="pattern">
          <option value="default">По умолчанию</option>
          <option value="none">Без паттерна</option>
          <option value="dots">Точки</option>
          <option value="crosses">Крестики</option>
          <option value="noise">Шум</option>
          <option value="svg">SVG: рельеф</option>
        </select>
      </label>
    </div>

    <div ref="preview" class="selected-preview">
      <ScaledCard :format>
        <component :is="previewCard" v-bind="previewProps">
          <template #background>
            <component :is="selected.component" v-bind="selectedPatternProps" />
          </template>
        </component>
      </ScaledCard>
      <div class="selected-description">
        <h2>{{ selected.number }} · {{ selected.name }}</h2>
        <p>{{ selected.description }}</p>
      </div>
    </div>

    <section v-for="group in backgroundGroups" :key="group.id" class="background-section" :class="group.id">
      <h2>{{ group.name }}</h2>
      <div class="variants">
        <button
          v-for="background in group.backgrounds"
          :key="background.id"
          type="button"
          class="variant"
          :class="{ selected: selected.id === background.id }"
          @click="selectBackground(background)">
          <ScaledCard :format>
            <component :is="previewCard" v-bind="previewProps">
              <template #background>
                <component :is="background.component" v-bind="background.props" />
              </template>
            </component>
          </ScaledCard>
          <span class="variant-heading">
            <span class="number">{{ background.number }}</span>
            <span>{{ background.name }}</span>
          </span>
          <span class="variant-description">{{ background.description }}</span>
        </button>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef } from 'vue'
import type { MetaFormat } from '@/meta/utils'
import { metaCardBackgrounds } from '@/shared/ui/meta/components/utils/backgrounds'
import contoursPattern from '@/shared/ui/meta/components/assets/contours.svg?url'
import ScaledCard from '../ScaledCard.vue'
import GeneralMetaCard from '@/shared/ui/meta/generalMetaCard/GeneralMetaCard.vue'
import StatisticsPreviewCard from './StatisticsPreviewCard.vue'

const example = ref<'general' | 'statistics'>('general')
const contentFull = ref(false)
const headerDivider = ref(true)
const footerDivider = ref(false)
const previewCard = computed(() => example.value === 'general' ? GeneralMetaCard : StatisticsPreviewCard)
const previewProps = computed(() => {
  if (example.value === 'general') return {}
  return { contentFull: contentFull.value, headerDivider: headerDivider.value, footerDivider: footerDivider.value }
})
const format = ref<MetaFormat>('og')
const pattern = ref('default')
const backgroundGroups = [
  { id: 'saved', name: 'Сохранённые', variants: ['contours', 'aurora', 'rays', 'aurora-mist', 'contours-glow', 'vehicles'] },
  { id: 'saved-patterns', name: 'Сохранённые паттерны', variants: ['pattern-dots', 'pattern-crosses'] },
].map(group => ({ ...group, backgrounds: metaCardBackgrounds.filter(background => group.variants.includes(background.id)) }))

const selected = shallowRef(metaCardBackgrounds.find(background => background.id === 'aurora-mist') ?? metaCardBackgrounds[0])
const selectedPatternProps = computed(() => {
  if (selected.value.supportsPattern === false || pattern.value === 'default') return selected.value.props
  return { pattern: pattern.value === 'svg' ? contoursPattern : pattern.value }
})

const preview = useTemplateRef<HTMLDivElement>('preview')

const selectBackground = (background: (typeof metaCardBackgrounds)[number]) => {
  selected.value = background
  pattern.value = 'default'
  preview.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped lang="scss">
.backgrounds {
  .page-heading {
    margin-bottom: 24px;

    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      line-height: 1.3;
    }

    p {
      margin: 6px 0 0;
      color: var(--studio-muted);
      line-height: 1.5;
    }
  }

  .preview-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 24px;
    margin-bottom: 20px;

    label {
      display: flex;
      align-items: center;
      gap: 10px;

      >span {
        color: var(--studio-muted);
        font-size: 12px;
      }

      select {
        appearance: none;
        min-width: 0;
        border: 0;
        border-radius: 4px;
        padding: 8px 34px 8px 12px;
        background-color: var(--studio-canvas);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='m1 1 5 5 5-5' fill='none' stroke='%23e6e6e6' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        color: var(--studio-text);
        font: inherit;
        cursor: pointer;
      }
    }
  }

  .selected-preview {
    max-width: 1000px;
    margin-bottom: 32px;
    scroll-margin-top: 24px;

    .scaled-card {
      border-radius: 4px;
    }

    .selected-description {
      padding: 16px 0 0;

      h2 {
        margin: 0;
        font-size: 16px;
        line-height: 1.4;
        font-weight: 600;
      }

      p {
        margin: 5px 0 0;
        color: var(--studio-muted);
        line-height: 1.5;
      }
    }
  }

  .background-section {
    margin-top: 32px;

    >h2 {
      margin: 0 0 16px;
      font-size: 18px;
      line-height: 1.4;
      font-weight: 600;
    }
  }

  .variants {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px;

    .variant {
      display: block;
      min-width: 0;
      padding: 8px;
      border: 1px solid transparent;
      border-radius: 5px;
      background: transparent;
      color: var(--studio-text);
      font: inherit;
      text-align: left;
      cursor: pointer;

      &:hover {
        background: var(--studio-surface);
      }

      &.selected {
        border-color: #6c94b1;
        background: var(--studio-surface);
      }

      .scaled-card {
        border-radius: 3px;
        pointer-events: none;
      }

      .variant-heading {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 8px;
        margin-top: 12px;
        font-weight: 600;

        .number {
          color: var(--studio-muted);
          font-size: 11px;
          font-weight: 400;
        }
      }

      .variant-description {
        display: block;
        margin-top: 5px;
        color: var(--studio-muted);
        font-size: 12px;
        line-height: 1.5;
      }
    }

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
}
</style>
