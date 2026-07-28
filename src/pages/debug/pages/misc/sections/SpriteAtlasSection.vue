<template>
  <DebugSection title="SpriteAtlas" id="sprite-atlas" source="src/shared/uiKit/spriteAtlas/SpriteAtlas.ts"
    description="Механизм на нейтральных данных, без игрового домена: как задаётся кадр, что для несуществующего ключа и что за границами картинки атласа. Применительно к танкам он уже разобран на странице техники.">

    <div class="debug-col">
      <span class="debug-label">Нейтральный атлас 4×2 — синтетическая SVG-картинка, а не игровой ассет</span>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">ключ</span>
          <select v-model="key">
            <option v-for="k in letters" :key="k" :value="k">{{ k }}</option>
            <option value="doesnotexist">doesnotexist (нет в атласе)</option>
            <option value="offscreen">offscreen (координаты за границей картинки)</option>
          </select>
        </label>
      </div>

      <div class="debug-row">
        <div class="debug-stage center short">
          <div v-if="sprite" class="sprite-frame" :class="sprite.atlasClass" :style="{
            backgroundPosition: sprite.backgroundPosition,
            width: sprite.width + 'px',
            height: sprite.height + 'px',
          }" />
          <p v-else class="debug-hint">getSprite('{{ key }}') → null</p>
        </div>

        <table class="debug-table" v-if="sprite">
          <tbody>
            <tr v-for="(value, field) in sprite" :key="field">
              <th>{{ field }}</th>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="debug-note">
        Кадр — это CSS-класс с background-image (инжектится в head один раз на classPrefix) плюс инлайновый
        background-position, width и height конкретного элемента. Для doesnotexist getSprite возвращает null, а не
        заглушку — фолбэк на резервный ключ (как 'no-image' у техники) целиком на совести вызывающего кода.
      </p>

      <p class="debug-note">
        У offscreen координаты (x: 400, y: 400) заведомо вне 160×80 картинки атласа — сам SpriteAtlas их никак не
        проверяет и молча вернёт для них валидный на вид объект кадра. На экране от этого просто пустой прямоугольник:
        background-position уводит картинку далеко за пределы блока, background-repeat: no-repeat не подставляет ничего
        взамен. Ни ошибки, ни предупреждения не будет.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">Гонка: getSprite() до окончания загрузки</span>
      <p class="debug-hint">
        Конструктор вызывает свой load() без await и не отдаёт наружу ни промиса, ни события «готов» — даже с чисто
        локальными данными (без единого fetch) load() всё равно асинхронный, и Map с кадрами заполняется на следующий
        тик. Кнопка ниже создаёт новый экземпляр SpriteAtlas и тут же спрашивает у него существующий ключ.
      </p>

      <div class="debug-row">
        <button class="debug-btn" @click="probe">создать новый атлас и сразу спросить кадр</button>
      </div>

      <table class="debug-table" v-if="probeResult">
        <thead>
          <tr>
            <th>момент вызова</th>
            <th>getSprite('a')</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>сразу после new SpriteAtlas(...)</th>
            <td :class="probeResult.immediate === null ? 'true' : 'false'">{{ probeResult.immediate === null ? 'null' :
              'кадр' }}</td>
          </tr>
          <tr>
            <th>тем же тиком чуть позже</th>
            <td :class="probeResult.later === null ? 'false' : 'true'">{{ probeResult.later === null ? 'null' : 'кадр'
            }}
            </td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        Верхняя строка — синхронный вызов сразу после конструктора, честный null даже для ключа 'a', который в атласе
        точно есть. Нижняя строка — тот же экземпляр и тот же ключ через setTimeout(0), к этому моменту load() уже
        отработал. На боевых страницах эту гонку почти никогда не поймать: атласы там — модульные синглтоны, созданные
        задолго до первого обращения (см. страницу техники), а не создаются по клику.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { SpriteAtlas } from '@/shared/uiKit/spriteAtlas/SpriteAtlas'

const cellSize = 40
const cols = 4
const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const colors = ['#e2504a', '#e2c94a', '#4ac9e2', '#4ae26b', '#a34ae2', '#e24aa3', '#4a5ee2', '#e2874a']

function buildNeutralAtlasImage() {
  const rects = letters.map((letter, i) => {
    const x = (i % cols) * cellSize
    const y = Math.floor(i / cols) * cellSize
    return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${colors[i]}"/>` +
      `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 5}" font-size="16" fill="#ffffffcc" text-anchor="middle" font-family="monospace">${letter}</text>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cellSize}" height="${2 * cellSize}">${rects}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const neutralAtlasImage = buildNeutralAtlasImage()

function buildAtlasInfo() {
  return [{
    info: { index: 0, defaultItemSize: { width: cellSize, height: cellSize } },
    data: [
      ...letters.map((letter, i) => ({ image: letter, x: (i % cols) * cellSize, y: Math.floor(i / cols) * cellSize })),
      { image: 'offscreen', x: 400, y: 400 },
    ],
  }]
}

const atlas = new SpriteAtlas({
  classPrefix: 'debug-neutral-atlas',
  atlasesInfo: buildAtlasInfo(),
  atlasesImages: { 0: neutralAtlasImage },
})

const key = ref(letters[0])
const sprite = computed(() => atlas.getSprite(key.value))

let probeCounter = 0
const probeResult = ref<{ immediate: unknown, later: unknown } | null>(null)

function probe() {
  probeCounter++
  const freshAtlas = new SpriteAtlas({
    classPrefix: `debug-neutral-atlas-probe-${probeCounter}`,
    atlasesInfo: buildAtlasInfo(),
    atlasesImages: { 0: neutralAtlasImage },
  })

  const immediate = freshAtlas.getSprite('a')
  probeResult.value = { immediate, later: null }

  setTimeout(() => {
    if (probeResult.value) probeResult.value = { ...probeResult.value, later: freshAtlas.getSprite('a') }
    freshAtlas.dispose()
  }, 0)
}

</script>


<style scoped lang="scss">
.sprite-frame {
  background-repeat: no-repeat;
}
</style>
