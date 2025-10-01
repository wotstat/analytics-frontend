<template>
  <BadgesLine :tagToText="tagToText" v-model="selected" @openSelectModal="openSelect" ref="badges" />
  <ModalWindow title="Выбор карты" :display="visibleModal" @close="visibleModal = false" :margin-block-start="'35px'">
    <template #controls>
      <CloseButton @click="visibleModal = false" />
    </template>

    <template #header-content>
      <div class="header-line">
        <SearchLine v-model="searchText" autofocus class="search-line" />
        <div class="vr"></div>
        <button class="variant mt-font selectable" @click="preferredGame = 'mt'"
          :class="preferredGame == 'mt' ? 'active' : ''">
          Lesta
        </button>
        <button class="variant mt-font selectable" @click="preferredGame = 'wot'"
          :class="preferredGame != 'mt' ? 'active' : ''">
          WG
        </button>
      </div>
    </template>

    <template #default>
      <ArenaSelectorModal :arenas="arenas.data" :game="preferredGame == 'mt' ? 'mt' : 'wot'" :search="searchText" />
    </template>
  </ModalWindow>
</template>


<script setup lang="ts">
import { LONG_CACHE_SETTINGS, queryAsync } from '@/db'
import BadgesLine from '../components/badges/BadgesLine.vue'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
import { ref } from 'vue'
import CloseButton from '@/shared/ui/modalWindow/buttons/closeButton/CloseButton.vue'
import SearchLine from '../components/searchLine/SearchLine.vue'
import ArenaSelectorModal from './arenaSelectorModal/ArenaSelectorModal.vue'
import { selectTagArenasLocalization } from '@/shared/i18n/i18n'
import { preferredGame } from '@/shared/global/globalPreferred'

const visibleModal = ref(false)
const searchText = ref('')

const arenas = queryAsync<{ region: string, battleMode: string, battleGameplay: string, tag: string, name: string, gameVersion: string }>(`
with
    arenas as (
      select region, battleMode, battleGameplay, splitByChar('/', arenaTag)[2] as tag, argMax(gameVersion, dateTime) as gameVersion
      from Event_OnBattleStart
      where region in ('RU', 'EU')
      group by arenaTag, region, battleGameplay, battleMode
    ),
    locals as (${selectTagArenasLocalization})
select region, battleMode, battleGameplay, tag, gameVersion, name
from arenas
left any join locals using tag;
`, { settings: LONG_CACHE_SETTINGS })

const selected = defineModel<Set<string>>({ default: new Set() })

function tagToText(tag: string) {
  return tag
}

function openSelect() {
  visibleModal.value = true
}


</script>

<style lang="scss" scoped>
.header-line {
  padding: 0 15px;
  margin-bottom: 10px;
  display: flex;
  gap: 5px;
  align-items: center;


  .search-line {
    width: 200px;
  }

  .vr {
    width: 1px;
    height: 30px;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .variant {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    padding: 0 10px;
    line-height: 1;
    font-size: 0.9em;

    .icon {
      height: 14px;
    }
  }

  .selectable {
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 5px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.07s;
    border: none;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    &.active {
      background-color: var(--blue-color);
    }
  }
}
</style>