<template>
  <div class="meta-card" :class="{ 'header-divider': headerDivider, 'footer-divider': footerDivider }"
    :style="{ '--meta-card-palette-muted': secondaryColor }">
    <div class="background">
      <slot name="background">
        <component :is="background ?? AuroraMistBackground" />
      </slot>
    </div>

    <div v-if="$slots['content-full']" class="content-full">
      <div class="content-body">
        <slot name="content-full" />
      </div>
    </div>

    <div class="heading">
      <slot v-if="$slots.header" name="header" />
      <template v-else>
        <h1 class="heading-title">
          <slot name="brand">
            <span v-if="specificBrand">{{ specificBrand }}</span>
            <span class="heading-brand" :class="{ accent: specificBrand }">{{ brand }}</span>
          </slot>
        </h1>
        <span v-if="label || $slots.label" class="label">
          <slot name="label">{{ label }}</slot>
        </span>
      </template>
    </div>

    <div class="content" :class="{ 'content-full': variant === 'full' && !$slots.content && !$slots['content-full'] }">
      <div class="content-body">
        <slot v-if="$slots.content" name="content" />
        <div v-else-if="!$slots['content-full']" class="message">
          <h1 class="title" :class="{ 'string-title': !$slots.title }">
            <slot name="title">{{ title }}</slot>
          </h1>
          <p v-if="subtitle || $slots.subtitle" class="subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </p>
        </div>
      </div>
    </div>

    <div class="footer">
      <slot v-if="$slots.footer" name="footer" />
      <template v-else>
        <span>{{ footer }}</span>
        <span v-if="footerRight">{{ footerRight }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, shallowRef, type Component } from 'vue'
import type { RenderContext } from '@/meta/utils'
import AuroraMistBackground from './backgrounds/AuroraMistBackground.vue'
import { metaCardPaletteKey, metaCardSecondaryColors, type MetaCardPalette } from './utils/palette'

withDefaults(defineProps<{
  variant?: 'full' | 'compact'
  headerDivider?: boolean
  footerDivider?: boolean
  context?: RenderContext
  specificBrand?: string
  brand?: string
  title?: string
  subtitle?: string
  label?: string
  footer?: string
  footerRight?: string
  background?: Component
}>(), {
  variant: 'full',
  brand: 'WotStat Analytics',
  title: 'WotStat Analytics',
  footerRight: 'wotstat.info',
})

const palette = shallowRef<MetaCardPalette>('lavender')
provide(metaCardPaletteKey, palette)

const secondaryColor = computed(() => metaCardSecondaryColors[palette.value])
</script>

<style scoped lang="scss">
.meta-card {
  --meta-card-text: #f7f7f8;
  --meta-card-muted: var(--meta-card-palette-muted);

  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  height: 100%;
  padding: var(--meta-card-padding, 56px 72px 44px);
  display: flex;
  flex-direction: column;
  gap: 32px;
  color: var(--meta-card-text);

  .background {
    position: absolute;
    inset: 0;
    z-index: -1;
  }

  .heading,
  .footer {
    position: relative;
    z-index: 1;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }

  .heading {
    &:empty {
      display: none;
    }

    .heading-title {
      display: flex;
      align-items: baseline;
      gap: 24px;
      flex-shrink: 0;
      margin: 0;
      font-size: 24px;
      line-height: 1.2;
      font-weight: 700;
    }

    .label {
      min-width: 0;
      max-width: 570px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--meta-card-muted);
      font-size: 20px;
      font-weight: 600;
      line-height: 1.4;
      text-align: right;
    }

    .heading-brand.accent {
      color: var(--meta-card-muted);
    }
  }

  .content,
  .content-full,
  .content-body {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .content-full {
    position: absolute;
    inset: 0;
    padding: inherit;
    padding-block: 0;
  }

  .message {
    .title {
      margin: 0;
      font-size: var(--meta-card-title-size, 88px);
      line-height: 1.04;
      font-weight: 700;
      overflow-wrap: anywhere;

      &.string-title {
        text-box: trim-start ex alphabetic;
      }
    }

    .subtitle {
      max-width: 900px;
      margin: 24px 0 0;
      color: var(--meta-card-muted);
      font-size: 30px;
      line-height: 1.4;
      text-box: trim-end ex alphabetic;
    }
  }

  .footer {
    margin-top: auto;

    &:empty {
      display: none;
    }

    color: var(--meta-card-muted);
    font-size: 20px;
    line-height: 1.4;
  }

  &:has(> .heading:empty) {
    padding-top: 0;
    gap: 0;
  }

  &.header-divider {
    .heading {
      padding-bottom: 24px;
      border-bottom: 1px solid #ffffff14;
    }
  }

  &.footer-divider {
    .footer {
      padding-top: 24px;
      border-top: 1px solid #ffffff14;
    }
  }
}
</style>
