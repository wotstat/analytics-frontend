<template>
  <DebugSection title="Состояния загрузки" id="loading-states" source="src/db/index.ts (queryAsync, query)"
    description="Что видно, пока ClickHouse не ответил, и что при ошибке запроса — вживую и искусственно.">

    <div class="debug-col">
      <p class="debug-label">статус общего списка техники (запрос один на всю страницу)</p>
      <div class="debug-row">
        <span class="debug-hint">status: <span class="debug-value">{{ listStatusLabel }}</span></span>
        <span class="debug-hint">строк: <span class="debug-value">{{ vehicleList.length }}</span></span>
      </div>
      <p class="debug-note">
        Запрос стартует сразу при импорте модуля <span class="debug-value">store.ts</span> (module-level
        <span class="debug-value">queryAsync</span>), обычно раньше, чем успевает смонтироваться эта секция — поймать
        живой <span class="debug-value">loading</span> здесь получится только на самой первой загрузке страницы, до
        того как ответ ClickHouse придёт.
      </p>
    </div>

    <div class="debug-col">
      <p class="debug-label">искусственный запрос — успех / ошибка</p>
      <div class="debug-row">
        <button class="debug-btn" @click="runQuery(true)">выполнить корректный запрос (select 1)</button>
        <button class="debug-btn" @click="runQuery(false)">выполнить битый запрос (несуществующая таблица)</button>
      </div>

      <div class="debug-stage short">
        <p v-if="manualStatus === 'idle'" class="debug-hint">(ничего не отправлено — ничего не отображается)</p>
        <p v-else-if="manualStatus === 'loading'" class="debug-hint">(запрос в полёте — тут тоже пусто, спиннера нет)
        </p>
        <p v-else-if="manualStatus === 'success'" class="debug-value">ok, строк: {{ manualRows }}</p>
        <p v-else class="debug-value error">{{ manualError }}</p>
      </div>

      <p class="debug-note">
        В проекте нет общего компонента-скелетона для запросов к ClickHouse: пока <span class="debug-value">status
          === loading</span>, вызывающий код сам решает, что показать (обычно — ничего). Ошибка ClickHouse долетает как
        обычный <span class="debug-value">Error</span> с текстом сервера в <span class="debug-value">.message</span>.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { isErrorStatus, loading, query, success } from '@/db'
import { vehicleList, vehicleListQuery } from '../store'

const listStatusLabel = computed(() => {
  const status = vehicleListQuery.value.status
  if (status === loading) return 'loading'
  if (status === success) return 'success'
  if (isErrorStatus(status)) return `error: ${status.reason}`
  return String(status)
})

const manualStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const manualRows = ref(0)
const manualError = ref('')

async function runQuery(valid: boolean) {
  manualStatus.value = 'loading'
  try {
    const { data } = await query<unknown>(valid ? 'select 1' : 'select * from __debug_nonexistent_table__')
    manualRows.value = data.length
    manualStatus.value = 'success'
  } catch (e) {
    manualError.value = (e as Error).message
    manualStatus.value = 'error'
  }
}
</script>


<style scoped lang="scss">
.debug-value.error {
  color: #ff453a;
}
</style>
