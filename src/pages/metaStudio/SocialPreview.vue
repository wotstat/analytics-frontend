<template>
  <div class="social-preview" :class="platform.id">
    <p class="message-url">{{ context.url }}</p>
    <div class="social-link">
      <ScaledCard v-if="context.meta.hasImage" :context="{ ...context, format: platform.format }" />
      <div class="link-copy">
        <span class="link-host">{{ hostname }}</span>
        <strong>{{ context.meta.title }}</strong>
        <p v-if="platform.id !== 'x' && context.meta.description">{{ context.meta.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type MetaFormat, type RenderContext } from '@/meta/utils'
import ScaledCard from './ScaledCard.vue'

const props = defineProps<{
  context: RenderContext
  platform: { id: string, name: string, format: MetaFormat }
}>()
const hostname = computed(() => new URL(props.context.url).hostname)
</script>

<style scoped lang="scss">
.social-preview {
  width: 100%;
  min-width: 0;
  padding: 24px;
  border-radius: 4px;
  background: #313338;
  color: #e3e5e8;

  p {
    margin: 0;
  }

  .message-url {
    color: #7bb9f2;
    font-size: 13px;
    overflow-wrap: anywhere;
    margin-bottom: 12px;
  }

  .social-link {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 4px;
    background: #282a2e;

    .link-copy {
      padding: 14px;

      .link-host {
        display: block;
        font-size: 11px;
        color: #a8aeb8;
        margin-bottom: 5px;
      }

      strong {
        display: block;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.4;
      }

      p {
        font-size: 12px;
        line-height: 1.5;
        margin-top: 6px;
      }
    }
  }

  &.telegram {
    background: #213342;

    .social-link {
      border-left: 3px solid #78b2d4;
      background: #1c2c38;
      padding: 0 10px 10px;
      border-radius: 2px;

      .link-copy {
        order: -1;
        padding: 8px 0 12px;

        .link-host, strong {
          color: #8ec3e1;
        }
      }
    }
  }

  &.discord, &.slack {
    .social-link {
      border-left: 3px solid #697d9d;
      padding: 0 12px 12px;
      border-radius: 2px;

      .link-copy {
        order: -1;
        padding: 12px 0;

        strong {
          color: #7bb9f2;
        }
      }
    }
  }

  &.slack {
    background: #262326;

    .social-link {
      background: transparent;
      border-left-color: #777;
    }
  }

  &.x {
    background: #151515;

    .social-link {
      border: 1px solid #454545;
      border-radius: 12px;
    }
  }

  @media (max-width: 500px) {
    padding: 16px;
  }
}
</style>
