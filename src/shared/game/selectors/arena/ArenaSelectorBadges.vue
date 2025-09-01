<template>
  <BadgesLine :tagToText="tagToText" v-model="selected" @openSelectModal="openSelect" ref="badges" />
  <ModalWindow title="Выбор карты" :display="visibleModal" @close="visibleModal = false">
    <template #controls>
      <CloseButton @click="visibleModal = false" />
    </template>

    <template #header-content>
      <div class="header-line">
        <SearchLine v-model="searchText" autofocus class="search-line" />
      </div>
    </template>

    <template #default>
      <ArenaSelectorModal :arenas="arenas.data" :game="'mt'" :search="searchText" />
    </template>
  </ModalWindow>
</template>


<script setup lang="ts">
import { CACHE_SETTINGS, queryAsync } from '@/db'
import BadgesLine from '../components/badges/BadgesLine.vue'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
import { ref } from 'vue'
import CloseButton from '@/shared/ui/modalWindow/buttons/closeButton/CloseButton.vue'
import SearchLine from '../components/searchLine/SearchLine.vue'
import ArenaSelectorModal from './arenaSelectorModal/ArenaSelectorModal.vue'
import { selectTagArenasLocalization } from '@/shared/i18n/i18n'

const visibleModal = ref(false)
const searchText = ref('')

const arenas = queryAsync<{ region: string, battleMode: string, tag: string, name: string }>(`
with
    arenas as (
      select region, battleMode, splitByChar('/', arenaTag)[2] as tag
      from Event_OnBattleStart
      group by arenaTag, region, battleMode
    ),
    locals as (${selectTagArenasLocalization})
select region, battleMode, tag, name
from arenas
left any join locals using tag;
`, { settings: CACHE_SETTINGS })

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

  .search-line {
    width: 200px;
  }
}
</style>