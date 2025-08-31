<template>
  <BadgesLine :tagToText="tagToText" v-model="arenas" @openSelectModal="openSelect" ref="badges" />
  <ModalWindow title="Выбор карты" :display="visibleModal" @close="visibleModal = false">
    <template #controls>
      <button @click="visibleModal = false">Close</button>
    </template>

    <div class="modal-content">
      <p>Modal content goes here</p>
    </div>
  </ModalWindow>
</template>


<script setup lang="ts">
import { CACHE_SETTINGS, queryAsync } from '@/db'
import BadgesLine from '../components/badges/BadgesLine.vue'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
import { ref } from 'vue'

const visibleModal = ref(false)

const versions = queryAsync<{ region: string, version: string }>(`
  select region, gameVersionFull as version
  from GameVersions
  group by region, gameVersionFull
`, { settings: CACHE_SETTINGS })

const arenas = defineModel<Set<string>>({ default: new Set() })

function tagToText(tag: string) {
  return tag
}

function openSelect() {
  visibleModal.value = true
}


</script>

<style lang="scss" scoped>
.modal-content {
  background-color: #281a35;
  height: 2000px;
}
</style>