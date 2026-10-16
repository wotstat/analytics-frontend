<template>
  <MetaCard variant="content" class="delayed-meta-card" label="Debug / Open Graph">
    <div class="message">
      <span class="duration">5 секунд</span>
      <h1>{{ ready ? 'Карточка готова' : 'Подготовка карточки' }}</h1>
      <p>Тестовая задержка перед готовностью к рендеру.</p>
    </div>
    <template #footer>
      <span class="status" :class="{ ready }">{{ ready ? 'Готова к рендеру' : 'Ожидание 5 секунд…' }}</span>
      <span>/debug/meta/delayed</span>
    </template>
  </MetaCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMetaReady } from '@/meta/cards/useMetaReady'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'
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
  .message {
    .duration {
      font-size: 100px;
      font-weight: 700;
      line-height: 1;
    }

    h1 {
      margin: 20px 0 14px;
      font-size: 44px;
      line-height: 1.1;
    }

    p {
      margin: 0;
      font-size: 24px;
      color: var(--meta-card-muted);
    }
  }

  .status {
    color: #e4c18b;

    &.ready {
      color: #a9d1b0;
    }
  }
}
</style>
