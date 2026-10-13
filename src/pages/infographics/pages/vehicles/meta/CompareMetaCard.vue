<template>
  <div class="compare-card">
    <div class="card-heading">
      <span>WotStat Analytics</span>
      <span>СТАТИСТИКА ТЕХНИКИ</span>
    </div>
    <h1>Здесь будет<br>сравнение техники</h1>
    <div class="card-footer">
      <span>Статистика. Динамика. Сравнение.</span>
      <span>wotstat.info</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RenderContext } from '@/meta/utils'

defineProps<{ context: RenderContext }>()
</script>

<style scoped lang="scss">
.compare-card {
  height: 100%;
  padding: 64px 72px 54px;
  display: flex;
  flex-direction: column;
  background: #292c31;
  color: #f7f7f8;

  .card-heading, .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-heading {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -1px;

    span:last-child {
      color: #aaaeb7;
      font-size: 14px;
      letter-spacing: 3px;
      font-weight: 400;
    }
  }

  h1 {
    margin: auto 0;
    font-size: 76px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -3px;
  }

  .card-footer {
    font-size: 20px;
    color: #a2a5ab;
  }
}
</style>
