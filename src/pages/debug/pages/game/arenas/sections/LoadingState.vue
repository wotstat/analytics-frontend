<template>
  <DebugSection title="Состояния загрузки" id="loading-state"
    description="arenas.ts не использует queryComputed из @/db — это shallowRef, который заполняет один неотслеживаемый async loadArenas() при импорте модуля. Явного статуса loading/error, в отличие от queryComputed, здесь нет."
    source="src/shared/game/arenas/arenas.ts">

    <table class="debug-table">
      <tbody>
        <tr>
          <th>arenas.value.length</th>
          <td>{{ arenas.length }}</td>
        </tr>
        <tr>
          <th>состояние</th>
          <td>{{ arenas.length > 0 ? 'данные пришли' : 'ещё не пришли или пустой ответ — не различить' }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-hint">
      Если открыть эту страницу первой (до того, как что-то ещё импортировало arenas.ts), несколько кадров все секции
      выше рисуют пустые селекты и «Нет меты» — это нормально, реактивность подхватит данные сама, когда придёт ответ.
      Отличить «ещё грузится» от «пришёл пустой список» этот модуль не позволяет: обе ситуации — length === 0.
    </p>

    <div class="debug-row">
      <button class="debug-btn" @click="runOk">query(): корректный запрос</button>
      <button class="debug-btn" @click="runFail">query(): заведомо битый SQL</button>
      <button class="debug-btn" @click="log = []">очистить лог</button>
    </div>

    <div class="debug-log">
      <div class="debug-log-line" v-for="(line, i) in log" :key="i">
        <span class="debug-log-time">{{ line.time }}</span>
        <span>{{ line.text }}</span>
      </div>
      <div class="debug-log-empty" v-if="log.length === 0">лог пуст</div>
    </div>

    <p class="debug-note">
      arenas.ts вызывает низкоуровневый <span class="debug-value">query()</span> напрямую, а не queryComputed/queryAsync
      — значит ошибку сети или синтаксиса он просто не поймает и не покажет: промис loadArenas() падает молча
      (в консоль ничего не пишется, catch отсутствует). Кнопки выше используют тот же query() с заведомо битым SQL,
      чтобы показать, как выглядит настоящая ошибка ClickHouse — сам arenas.ts на неё так отреагировать не может.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { arenas } from '@/shared/game/arenas/arenas'
import { query, MEDIUM_CACHE_SETTINGS } from '@/db'

const log = ref<{ time: string, text: string }[]>([])

function push(text: string) {
  const time = new Date().toLocaleTimeString('ru-RU')
  log.value = [{ time, text }, ...log.value].slice(0, 20)
}

async function runOk() {
  push('query("select 1 as x") — отправлен')
  try {
    const result = await query<{ x: number }>('select 1 as x', { settings: MEDIUM_CACHE_SETTINGS, allowCache: false })
    push(`успех: ${JSON.stringify(result.data)}, elapsed=${result.statistics?.elapsed ?? '?'}с`)
  } catch (e) {
    push(`неожиданная ошибка: ${(e as Error).message}`)
  }
}

async function runFail() {
  push('query("this is not sql") — отправлен')
  try {
    await query('this is not sql', { allowCache: false })
    push('неожиданно успешно')
  } catch (e) {
    push(`ошибка: ${(e as Error).message}`)
  }
}
</script>
