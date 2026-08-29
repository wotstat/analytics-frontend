<template>
  <DebugSection title="minimapUrl: как собирается адрес картинки" id="minimap-url"
    description="Адрес зависит от игры, размера, tag, gameplay и формата. Small хранится плоско в minimap[/comp7], medium — в папке арены как minimap-medium/{tag}/mmap[_comp7]. tagToImageName в сборке URL не участвует (см. заметку ниже)."
    source="src/shared/game/arenas/arenas.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">арена</span>
        <select v-model="selectedKey">
          <option v-for="arena in arenaList" :key="`${arena.game}:${arena.tag}`" :value="`${arena.game}:${arena.tag}`">
            {{ arena.name }} ({{ arena.tag }})
          </option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">префикс spaces/</span>
        <input type="checkbox" v-model="withSpacesPrefix">
      </label>

      <label class="debug-control">
        <span class="debug-label">game</span>
        <select v-model="game">
          <option value="mt">mt</option>
          <option value="wot">wot</option>
        </select>
      </label>
    </div>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">gameplay</span>
        <select v-model="gameplayChoice">
          <option value="__none__">— (null, обычный фон)</option>
          <option v-for="g in allGameplays" :key="g" :value="g">{{ g }}</option>
          <option value="__custom__">свой текст</option>
        </select>
      </label>

      <input type="text" v-if="gameplayChoice === '__custom__'" v-model="customGameplay"
        placeholder="например nonsense">

      <label class="debug-control">
        <span class="debug-label">size</span>
        <select v-model="size">
          <option value="small">small</option>
          <option value="medium">medium</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">format</span>
        <select v-model="format">
          <option value="webp">webp</option>
          <option value="png">png</option>
        </select>
      </label>
    </div>

    <table class="debug-table params">
      <tbody>
        <tr>
          <th>исходный tag</th>
          <td>{{ rawTag }}</td>
        </tr>
        <tr>
          <th>tagToImageName(tag)</th>
          <td>{{ imageName }}</td>
        </tr>
        <tr>
          <th>getArenaMeta(...)?.minimap</th>
          <td>{{ meta?.minimap ?? '— меты нет для этого game+tag+gameplay' }}</td>
        </tr>
        <tr>
          <th>содержит '_comp7'</th>
          <td :class="hasComp7 ? 'true' : 'false'">{{ hasComp7 }}</td>
        </tr>
        <tr>
          <th>итоговый URL</th>
          <td class="url">{{ url }}</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-stage center short">
      <img :src="url" class="preview" :alt="url">
    </div>

    <p class="debug-note">
      tagToImageName режет tag по последнему '/' и лоуркейсит — для тегов арен из ArenasLatest (они уже без префикса,
      вида <span class="debug-value">01_karelia</span>) это тождественная операция. minimapUrl строит URL сам и
      tagToImageName не вызывает вовсе — только сам режет опциональный префикс <span class="debug-value">spaces/</span>.
      Включи чекбокс выше — URL не изменится, что и подтверждает независимость от tagToImageName.
    </p>

    <p class="debug-note">
      Размер меняет только источник картинки, но не CSS-размер превью: <span class="debug-value">small</span> берётся
      из <span class="debug-value">minimap/{tag}</span> (для Натиска — <span
        class="debug-value">minimap/comp7/{tag}</span>), а <span class="debug-value">medium</span> — из <span
        class="debug-value">minimap-medium/{tag}/mmap</span> или <span
        class="debug-value">mmap_comp7</span>.
    </p>

    <p class="debug-note">
      Переключи game на одной и той же арене с gameplay=comp7: у части арен comp7-мета в mt содержит '_comp7' в имени
      файла, а в wot — нет (или наоборот). Тогда при одинаковых tag/gameplay папка URL отличается между играми —
      это решается не самим gameplay, а тем, что реально записано в поле minimap у меты этой конкретной комбинации.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { getArenaMeta, minimapUrl, tagToImageName } from '@/shared/game/arenas/arenas'
import { GameVendor } from '@/shared/game/wot'
import { useArenaOptions } from '../shared/useArenaOptions'

const { arenaList, allGameplays } = useArenaOptions()

// game ниже — отдельный переключатель, специально независимый от game внутри выбранной арены (см. заметку про comp7).
const selectedKey = ref('')
watch(arenaList, (list) => {
  if (selectedKey.value || list.length === 0) return
  selectedKey.value = `${list[0].game}:${list[0].tag}`
}, { immediate: true })

const withSpacesPrefix = ref(false)
const game = ref<GameVendor>('mt')
const gameplayChoice = ref('__none__')
const customGameplay = ref('')
const size = ref<'small' | 'medium'>('small')
const format = ref<'webp' | 'png'>('webp')

const baseTag = computed(() => selectedKey.value.split(':').slice(1).join(':') || '01_karelia')
const rawTag = computed(() => withSpacesPrefix.value ? `spaces/${baseTag.value}` : baseTag.value)
const imageName = computed(() => tagToImageName(rawTag.value))

const gameplay = computed<null | string>(() => {
  if (gameplayChoice.value === '__none__') return null
  if (gameplayChoice.value === '__custom__') return customGameplay.value || null
  return gameplayChoice.value
})

const meta = computed(() => {
  const gp = gameplay.value
  return gp ? getArenaMeta(game.value, rawTag.value, gp) : undefined
})
const hasComp7 = computed(() => meta.value?.minimap.includes('_comp7') ?? false)
const url = computed(() => minimapUrl(rawTag.value, game.value, gameplay.value, format.value, size.value))
</script>


<style scoped lang="scss">
.params th {
  white-space: nowrap;
  text-align: left;
}

.params td {
  text-align: left;
  font-family: var(--debug-mono);
  font-size: 12px;
}

.url {
  word-break: break-all;
}

.preview {
  max-width: 220px;
  max-height: 220px;
}
</style>
