<template>
  <div class="meta-card" :class="`variant-${variant}`" :style="{ '--meta-card-palette-muted': secondaryColor }">
    <div class="background">
      <slot name="background">
        <component :is="background ?? AuroraMistBackground" />
      </slot>
    </div>

    <div class="heading">
      <h1 v-if="variant === 'content'" class="heading-title">
        <slot name="title">{{ title }}</slot>
      </h1>
      <span v-else class="wordmark">WotStat</span>
      <span v-if="label" class="label">{{ label }}</span>
    </div>

    <div class="content">
      <slot>
        <div v-if="variant === 'default'" class="message">
          <h1 class="title">
            <slot name="title">{{ title }}</slot>
          </h1>
          <p v-if="subtitle || $slots.subtitle" class="subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </p>
        </div>
      </slot>
    </div>

    <div class="footer">
      <slot name="footer">
        <span>{{ footer }}</span>
        <span>wotstat.info</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, shallowRef, type Component } from 'vue'
import AuroraMistBackground from './backgrounds/AuroraMistBackground.vue'
import { metaCardPaletteKey, metaCardSecondaryColors, type MetaCardPalette } from './utils/palette'

withDefaults(defineProps<{
  variant?: 'default' | 'content'
  title?: string
  subtitle?: string
  label?: string
  footer?: string
  background?: Component
}>(), {
  variant: 'default',
  title: 'WotStat Analytics',
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

    .heading-title,
    .wordmark {
      margin: 0;
      font-size: 26px;
      line-height: 1.2;
      font-weight: 700;
    }

    .label {
      color: var(--meta-card-muted);
      font-size: 14px;
      line-height: 1.4;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
  }

  .content {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .message {
      .title {
        margin: 0;
        font-size: var(--meta-card-title-size, 88px);
        line-height: 1.04;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .subtitle {
        max-width: 900px;
        margin: 24px 0 0;
        color: var(--meta-card-muted);
        font-size: 30px;
        line-height: 1.4;
      }
    }
  }

  .footer {
    color: var(--meta-card-muted);
    font-size: 20px;
    line-height: 1.4;
  }

  &.variant-content .heading {
    padding-bottom: 24px;
    border-bottom: 1px solid #ffffff14;
  }
}
</style>
