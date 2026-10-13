<template>
  <div class="default-card">
    <span class="card-wordmark">WotStat</span>
    <h1>WotStat <span>Analytics</span></h1>
    <div class="card-footer">
      <span>СТАТИСТИКА ТАНКОВЫХ БОЁВ</span>
      <span>wotstat.info</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RenderContext } from '@/meta/utils'

defineProps<{ context: RenderContext }>()
</script>

<style scoped lang="scss">
.default-card {
  height: 100%;
  padding: 64px 72px 54px;
  display: flex;
  flex-direction: column;
  background: #303236;
  color: #f7f7f8;

  .card-wordmark {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -1px;
  }

  h1 {
    margin: auto 0;
    font-size: 88px;
    line-height: 1.04;
    letter-spacing: -5px;
    font-weight: 700;

    span {
      display: block;
      color: #b8bbc0;
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #a2a5ab;
    font-size: 20px;

    span:first-child {
      font-size: 14px;
      letter-spacing: 3px;
    }
  }
}
</style>
