<template>
  <MetaCard variant="content" class="vehicle-meta-card" label="Debug / Open Graph">
    <VehicleImage v-if="tag" class="vehicle-image" :tag size="shop" loading="eager" />
    <div class="message">
      <p>Техника</p>
      <h1>{{ name }}</h1>
      <span class="tag">{{ tag || 'Укажите ?tag=ussr:R45_IS-7' }}</span>
    </div>
    <template #footer>
      <span>{{ status }}</span>
      <span>/debug/meta/vehicle</span>
    </template>
  </MetaCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DAILY_CACHE, query } from '@/db'
import { useMetaReady } from '@/meta/cards/useMetaReady'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'
import type { RenderContext } from '@/meta/utils'
import VehicleImage from '@/shared/game/components/vehicles/vehicleImage/VehicleImage.vue'

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
  .vehicle-image {
    position: absolute;
    top: 50%;
    right: -162px;
    width: 660px;
    transform: translateY(-50%);
    object-fit: contain;
  }

  .message {
    position: relative;
    max-width: 540px;

    p {
      margin: 0 0 18px;
      color: var(--meta-card-muted);
      font-size: 24px;
    }

    h1 {
      margin: 0 0 24px;
      font-size: 76px;
      line-height: 1.1;
      overflow-wrap: anywhere;
    }

    .tag {
      color: var(--meta-card-muted);
      font-size: 24px;
    }
  }
}
</style>
