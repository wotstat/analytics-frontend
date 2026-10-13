<template>
  <div class="delayed-meta-card">
    <div class="card-heading">
      <span>WotStat Analytics</span>
      <span>DEBUG / OPEN GRAPH</span>
    </div>
    <div class="message">
      <span class="duration">5 секунд</span>
      <h1>{{ ready ? 'Карточка готова' : 'Подготовка карточки' }}</h1>
      <p>Тестовая задержка перед готовностью к рендеру.</p>
    </div>
    <div class="card-footer">
      <span class="status" :class="{ ready }">{{ ready ? 'Готова к рендеру' : 'Ожидание 5 секунд…' }}</span>
      <span>/debug/meta/delayed</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMetaReady } from '@/meta/cards/useMetaReady'
import type { RenderContext } from '@/meta/utils'

const props = defineProps<{ context: RenderContext }>()
const ready = ref(false)

useMetaReady(async ({ signal }) => {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel)
      resolve()
    }, 5000)

    const cancel = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }

    signal.addEventListener('abort', cancel, { once: true })
  })

  ready.value = true
})
</script>

<style scoped lang="scss">
.delayed-meta-card {
  height: 100%;
  padding: 64px 72px 54px;
  display: flex;
  flex-direction: column;
  background: #242d38;
  color: #f7f7f8;

  .card-heading,
  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-heading {
    font-size: 26px;
    font-weight: 700;

    span:last-child {
      color: #9daabd;
      font-size: 16px;
      letter-spacing: 3px;
      font-weight: 400;
    }
  }

  .message {
    margin: auto 0;

    .duration {
      font-size: 100px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -4px;
    }

    h1 {
      margin: 20px 0 14px;
      font-size: 44px;
      line-height: 1.1;
    }

    p {
      margin: 0;
      font-size: 24px;
      color: #a9b7c9;
    }
  }

  .card-footer {
    font-size: 20px;
    color: #9daabd;

    .status {
      color: #e4c18b;

      &.ready {
        color: #a9d1b0;
      }
    }
  }
}
</style>
