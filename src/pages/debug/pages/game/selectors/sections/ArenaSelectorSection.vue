<template>
  <DebugSection title="Селектор карт" id="arena"
    description="Модалка со списком арен, выбор нескольких, переключатель команд у карты и бейджи с хешем «тег:команда». Сам список с миникартами вживую — в секции про данные."
    source="src/shared/game/selectors/arena/">

    <div class="debug-row">
      <button class="debug-btn" @click="addTags(take(arenaHashes, 3))">+3 карты</button>
      <button class="debug-btn" @click="addTags(take(arenaHashes, 30))">+30 карт</button>
      <button class="debug-btn" @click="addTags(arenaHashes)">выбрать всё ({{ arenaHashes.length }})</button>
      <button class="debug-btn" @click="addTags(brokenArenaHashes)">+ мусорные хеши</button>
    </div>

    <div class="debug-stage">
      <div class="selector-box">
        <p>Карта:</p>
        <ArenaSelectorBadges v-model="selected" />
      </div>
    </div>

    <SelectionReadout v-model="selected" :tag-to-text="describe" :total="arenaHashes.length"
      title="Выбрано (сырой хеш → разбор)" />

    <p class="debug-note">
      В модели не тег арены, а хеш <span class="debug-value">тег:команда</span>
      (<span class="debug-value">arena/utils.ts</span>). Команда — <span class="debug-value">any</span> или номер;
      переключатель <b>1 / / 2</b> над миникартой появляется только у карт, где
      <span class="debug-value">getArenaMeta</span> нашла две команды, и заменяет хеш целиком. Проверь, что выбор карты
      без переключателя даёт ровно <span class="debug-value">тег:any</span>.
    </p>

    <p class="debug-note">
      Мусорные хеши ломают подпись, и это баг: <span class="debug-value">hashToArena</span> никогда не возвращает
      <span class="debug-value">null</span>, а проверка в <span class="debug-value">tagToText</span> написана как
      <span class="debug-value">if (!info) return tag</span> и потому мертва. Хеш без
      <span class="debug-value">:команды</span> превращается в <span class="debug-value">team: NaN</span> и пустой тег,
      так что в бейдже оказывается <span class="debug-value">/NaN</span> — жать «выбрать» после этого всё ещё можно,
      но что выбрано, уже не прочитать.
    </p>

    <p class="debug-note">
      Карты — единственный селектор на модалке, а не на поповере:
      <span class="debug-value">ArenaSelectorPopup</span> — это <span class="debug-value">ModalWindow</span> с
      <span class="debug-value">Teleport to="body"</span>. Отсюда другое поведение: закрытие крестиком, кликом по фону
      и Escape, блокировка скролла страницы, отдельный подвал со строкой бейджей и «Ничего не выбрано». Внутренние
      фильтры (поиск, сезон, «Только актуальные») сбрасываются
      <span class="debug-value">@after-close</span> — то есть после закрытия, а не при открытии.
    </p>

    <p class="debug-note">
      Тач: список карт длинный, свайп по нему не должен ни выбирать карту, ни закрывать модалку. У самих плиток
      <span class="debug-value">touch-action: manipulation</span>, а у переключателя команд —
      <span class="debug-value">@click.stop</span>: тап по «1» или «2» не обязан снимать выбор карты.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ArenaSelectorBadges from '@/shared/game/selectors/arena/ArenaSelectorBadges.vue'
import { hashToArena } from '@/shared/game/selectors/arena/utils'
import { getArenaName } from '@/shared/i18n/i18n'
import SelectionReadout from '../shared/SelectionReadout.vue'
import { brokenArenaHashes } from '../shared/fixtures'
import { arenaHashes, take } from '../shared/lists'

const selected = ref(new Set<string>())

function describe(hash: string) {
  const info = hashToArena(hash)
  return `tag: ${info.tag || '—'} | team: ${info.team} | ${getArenaName(info.tag)}`
}

function addTags(tags: readonly string[]) {
  for (const tag of tags) selected.value.add(tag)
}

</script>


<style scoped lang="scss">
.selector-box {
  display: flex;
  align-items: baseline;
  gap: 0.3em;
  max-width: 420px;
  font-size: 18px;
}
</style>
