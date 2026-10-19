<template>
  <MetaCard header-divider class="time-meta-card" label="Debug / Open Graph">
    <template #content-full>
      <div class="time-display">
        <div class="timestamp">
          <h1>{{ time }}</h1>
          <p>{{ date }} · UTC</p>
        </div>
        <svg class="timer" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 2h4m-2 0v4m8 0-2 2" />
          <circle cx="12" cy="14" r="8" />
          <path d="M12 10v4l2.5 1.5" />
        </svg>
      </div>
    </template>
    <template #footer>
      <span>Время на сервере</span>
      <span>/debug/meta/time</span>
    </template>
  </MetaCard>
</template>

<script setup lang="ts">
import type { RenderContext } from '@/meta/utils'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'

defineProps<{ context: RenderContext }>()

const timestamp = new Date().toISOString()
const time = timestamp.slice(11, 19)
const date = timestamp.slice(0, 10)
</script>

<style scoped lang="scss">
.time-meta-card {
  .time-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 72px;

    .timestamp {
      font-variant-numeric: tabular-nums;

      h1 {
        margin: 0;
        font-size: 144px;
        font-weight: 700;
        line-height: 1.1;
      }

      p {
        margin: 20px 0 0;
        font-size: 32px;
        color: var(--meta-card-muted);
      }
    }

    .timer {
      flex: none;
      width: 220px;
      height: 220px;
      color: var(--meta-card-muted);
      opacity: .7;
    }
  }
}
</style>
