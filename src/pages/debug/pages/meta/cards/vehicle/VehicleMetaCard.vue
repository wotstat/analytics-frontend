<template>
  <div class="vehicle-meta-card">
    <div class="card-heading">
      <span>WotStat Analytics</span>
      <span>DEBUG / OPEN GRAPH</span>
    </div>
    <div class="message">
      <p>Техника</p>
      <h1>{{ name }}</h1>
      <span class="tag">{{ tag || 'Укажите ?tag=ussr:R45_IS-7' }}</span>
    </div>
    <div class="card-footer">
      <span>{{ status }}</span>
      <span>/debug/meta/vehicle</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DAILY_CACHE, query } from '@/db'
import { useMetaReady } from '@/meta/cards/useMetaReady'
import type { RenderContext } from '@/meta/utils'

const props = defineProps<{ context: RenderContext }>()
const tag = new URL(props.context.url).searchParams.get('tag') ?? ''
const name = ref('Загрузка…')
const status = ref('Получение названия')

useMetaReady(async ({ signal }) => {
  if (!/^[a-z]+:[A-Za-z0-9_-]{1,128}$/.test(tag)) {
    name.value = 'Укажите тег танка'
    status.value = 'Некорректный параметр tag'
    return
  }

  try {
    const result = await query<{ name: string }>(`
      SELECT dictGetOrDefault('WOT.VehiclesLocalizationDictionary', 'name', ('RU', 'RU', '${tag}'), '') AS name
      LIMIT 1
    `, {
      cache: DAILY_CACHE,
      proxyCache: true,
      abortSignal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      settings: {
        max_execution_time: 5,
        max_rows_to_read: '1000000',
        max_bytes_to_read: '100000000',
        query_cache_nondeterministic_function_handling: 'save',
      },
    })
    const vehicleName = result.data[0]?.name
    name.value = vehicleName || 'Танк не найден'
    status.value = vehicleName ? 'Название загружено' : 'В справочнике нет такого тега'
  } catch (error) {
    name.value = 'Ошибка загрузки'
    status.value = 'Не удалось получить название'
    throw error
  }
})
</script>

<style scoped lang="scss">
.vehicle-meta-card {
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

    p {
      margin: 0 0 18px;
      color: #a9b7c9;
      font-size: 24px;
    }

    h1 {
      margin: 0 0 24px;
      font-size: 76px;
      line-height: 1.1;
      overflow-wrap: anywhere;
    }

    .tag {
      color: #a9b7c9;
      font-size: 24px;
    }
  }

  .card-footer {
    font-size: 20px;
    color: #9daabd;
  }
}
</style>
