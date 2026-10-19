<template>
  <MetaCard :header-divider :footer-divider class="statistics-preview-card" label="Статистика игрока"
    footer="Динамика. Результаты. Прогресс.">
    <template #background><slot name="background" /></template>
    <template #[contentSlot]>
      <div class="statistics">
        <div class="message">
          <p>Ваши результаты</p>
          <h1>Каждый бой<br>в цифрах</h1>
          <span>Следите за прогрессом вместе с WotStat</span>
        </div>
        <div class="metrics">
          <div v-for="metric in metrics" :key="metric.label" class="metric">
            <strong>{{ metric.value }}</strong>
            <span>{{ metric.label }}</span>
          </div>
        </div>
      </div>
    </template>
  </MetaCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'

const props = defineProps<{
  contentFull?: boolean
  headerDivider?: boolean
  footerDivider?: boolean
}>()

const contentSlot = computed(() => props.contentFull ? 'content-full' : 'content')

const metrics = [
  { label: 'Победы', value: '56,8 %' },
  { label: 'Средний урон', value: '2 486' },
  { label: 'Боёв сыграно', value: '1 024' },
]
</script>

<style scoped lang="scss">
.statistics-preview-card {
  .statistics {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 64px;
  }

  .message {
    max-width: 620px;

    p {
      margin: 0 0 18px;
      color: var(--meta-card-muted);
      font-size: 24px;
    }

    h1 {
      margin: 0 0 24px;
      font-size: 76px;
      line-height: 1.1;
    }

    >span {
      color: var(--meta-card-muted);
      font-size: 22px;
      line-height: 1.4;
    }
  }

  .metrics {
    flex: none;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-left: 40px;
    border-left: 1px solid #ffffff24;

    .metric {
      display: flex;
      flex-direction: column;
      gap: 6px;

      strong {
        font-size: 48px;
        line-height: 1.1;
      }

      span {
        color: var(--meta-card-muted);
        font-size: 20px;
        line-height: 1.4;
      }
    }
  }
}
</style>
