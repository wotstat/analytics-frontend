<template>
  <DebugPage title="Мини-реплей"
    description="Экспериментальный проигрыватель общего состояния боя: HTML-маркеры техники, canvas-трассеры и результаты по игрокам."
    source="src/pages/debug/pages/game/miniReplay/">

    <DebugSection title="Общая информация о бое" id="battle-info"
      description="Метаданные захвата и результата. Можно открыть любой JSON schemaVersion 1 из mini-replay-data/wotstat-mini-replays/."
      source="mini-replay-data/MINI_REPLAY_FORMAT.md">
      <BattleSummary v-if="prepared" :replay="prepared" :source-name="sourceName" :loading :error :is-default
        @load="loadFile" @reset="resetReplay" />
      <div class="lazy-state" v-else>
        <span class="spinner" v-if="!error"></span>
        <span>{{ error || 'Загружаю пример реплея отдельным чанком…' }}</span>
        <button class="debug-btn" type="button" v-if="error" @click="loadDefaultReplay">Повторить</button>
      </div>
    </DebugSection>

    <DebugSection title="Миникарта с реплеем" id="replay-map"
      description="Техника отрисована HTML-элементами, трассеры и точки взрывов — canvas. Разрывы между trackSegments не интерполируются."
      source="src/pages/debug/pages/game/miniReplay/components/ReplayMap.vue">
      <ReplayMap v-if="prepared" :replay="prepared" :tick="currentTick" :playing :speed
        @play="play" @pause="pause" @seek="seek" @update:speed="speed = $event" />
      <div class="lazy-placeholder" v-else></div>
    </DebugSection>

    <DebugSection title="Таблица результатов" id="battle-results"
      description="Клик по игроку заменяет противоположную команду подробностями. В многотанковом режиме сверху появляется переключатель техники."
      source="src/pages/debug/pages/game/miniReplay/components/ResultsTable.vue">
      <ResultsTable v-if="prepared" :replay="prepared" />
      <div class="lazy-placeholder short" v-else></div>
    </DebugSection>
  </DebugPage>
</template>


<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import BattleSummary from './components/BattleSummary.vue'
import ReplayMap from './components/ReplayMap.vue'
import ResultsTable from './components/ResultsTable.vue'
import { prepareReplay } from './model'
import type { MiniReplay, PreparedReplay } from './types'

const defaultSourceName = '27003595046773758_11527830.json'
const sourceName = ref('')
const prepared = shallowRef<PreparedReplay | null>(null)
const currentTick = ref(0)
const playing = ref(false)
const speed = ref(1)
const loading = ref(false)
const error = ref('')
const isDefault = computed(() => sourceName.value === defaultSourceName)

let animationFrame = 0
let previousFrameTime = 0

function animationStep(time: number) {
  const replay = prepared.value
  if (!playing.value || !replay) return
  if (!previousFrameTime) previousFrameTime = time
  const elapsedSeconds = Math.min(0.1, (time - previousFrameTime) / 1000)
  previousFrameTime = time
  currentTick.value += elapsedSeconds * speed.value / replay.raw.battle.tickLength

  if (currentTick.value >= replay.maxTick) {
    currentTick.value = replay.maxTick
    pause()
    return
  }
  animationFrame = requestAnimationFrame(animationStep)
}

function play() {
  const replay = prepared.value
  if (!replay) return
  if (currentTick.value >= replay.maxTick) currentTick.value = 0
  if (playing.value) return
  playing.value = true
  previousFrameTime = 0
  animationFrame = requestAnimationFrame(animationStep)
}

function pause() {
  playing.value = false
  previousFrameTime = 0
  cancelAnimationFrame(animationFrame)
}

function seek(tick: number) {
  const replay = prepared.value
  if (!replay) return
  currentTick.value = Math.max(0, Math.min(replay.maxTick, tick))
}

function applyReplay(replay: MiniReplay, name: string) {
  if (replay.schemaVersion !== 1) {
    throw new Error(`Ожидалась schemaVersion 1, получена ${replay.schemaVersion ?? 'неизвестная версия'}`)
  }
  if (!replay.battle || !Array.isArray(replay.vehicleLives) || !Array.isArray(replay.participants)) {
    throw new Error('Файл не похож на mini replay: нет battle, participants или vehicleLives')
  }

  pause()
  prepared.value = prepareReplay(replay)
  sourceName.value = name
  currentTick.value = 0
}

async function loadFile(file: File) {
  loading.value = true
  error.value = ''
  try {
    const text = await file.text()
    applyReplay(JSON.parse(text) as MiniReplay, file.name)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
  } finally {
    loading.value = false
  }
}

async function loadDefaultReplay() {
  loading.value = true
  error.value = ''
  try {
    const { default: defaultReplayJson } = await import('./fixture.json')
    applyReplay(defaultReplayJson as MiniReplay, defaultSourceName)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason)
  } finally {
    loading.value = false
  }
}

const resetReplay = loadDefaultReplay

onMounted(loadDefaultReplay)
onBeforeUnmount(pause)
</script>


<style scoped lang="scss">
.lazy-state {
  display: flex;
  align-items: center;
  gap: 0.65em;
  min-height: 72px;
  padding: 0.8em 1em;
  border: 1px solid var(--debug-border);
  border-radius: 8px;
  color: var(--debug-dim);
  font-size: 12px;
  background: var(--debug-surface);
}

.spinner {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  border: 2px solid #ffffff22;
  border-top-color: var(--blue-thin-color);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

.lazy-placeholder {
  min-height: min(68vw, 620px);
  border: 1px solid var(--debug-border);
  border-radius: 8px;
  background: linear-gradient(110deg, #ffffff07 20%, #ffffff0d 35%, #ffffff07 50%);
  background-size: 220% 100%;
  animation: shimmer 1.3s linear infinite;

  &.short {
    min-height: 260px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  to {
    background-position-x: -220%;
  }
}
</style>
