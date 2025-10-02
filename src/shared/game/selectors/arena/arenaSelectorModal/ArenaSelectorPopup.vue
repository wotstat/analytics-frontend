<template>
  <ModalWindow title="Выбор карты" :display="visibleModal" @close="emit('close')" :margin-block-start="'35px'"
    @after-close="reset">
    <template #controls>
      <CloseButton @click="emit('close')" />
    </template>

    <template #header-content>
      <div class="header-line">
        <div class="search-container">
          <SearchLine v-model="searchText" autofocus class="search-line" />
          <div class="game-select">
            <div class="vr"></div>
            <button class="variant mt-font selectable" @click="preferredGame = 'mt'"
              :class="{ 'active': preferredGame === 'mt' }">
              Lesta
            </button>
            <button class="variant mt-font selectable" @click="preferredGame = 'wot'"
              :class="{ 'active': preferredGame === 'wot' }">
              WG
            </button>
          </div>
        </div>

        <div class="filter">
          <div class="vr"></div>
          <div class="season-select">
            <button class="variant mt-font selectable" @click="selectSeason('winter')"
              :class="{ 'active': season === 'winter' }">
              Зима
            </button>
            <button class="variant mt-font selectable" @click="selectSeason('summer')"
              :class="{ 'active': season === 'summer' }">
              Лето
            </button>
            <button class="variant mt-font selectable" @click="selectSeason('desert')"
              :class="{ 'active': season === 'desert' }">
              Пустыня
            </button>
          </div>
          <div class="vr"></div>

          <div class="checkbox-section">
            <label class="mt-font checkbox">
              <input type="checkbox" v-model="onlyActual">
              Только актуальные
            </label>
            <div class="space flex-1"></div>
            <div class="reset-container" :class="{ 'disabled': !canReset }">
              <button class="reset" @click="reset">
                <Reload />
              </button>
              <div class="vr"></div>
            </div>
          </div>
        </div>

        <div class="game-select">
          <button class="variant mt-font selectable" @click="preferredGame = 'mt'"
            :class="{ 'active': preferredGame === 'mt' }">
            Lesta
          </button>
          <button class="variant mt-font selectable" @click="preferredGame = 'wot'"
            :class="{ 'active': preferredGame === 'wot' }">
            WG
          </button>
        </div>
      </div>
    </template>

    <template #default>
      <ArenaSelectorModal :arenas="arenas" :game="preferredGame == 'mt' ? 'mt' : 'wot'" :search="searchText" :season
        :onlyActual @reset="reset" />
    </template>
  </ModalWindow>
</template>


<script setup lang="ts">
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
import Reload from '@/assets/icons/reset.svg'
import CloseButton from '@/shared/ui/modalWindow/buttons/closeButton/CloseButton.vue'
import SearchLine from '../../components/searchLine/SearchLine.vue'
import ArenaSelectorModal from './ArenaSelectorContent.vue'
import { preferredGame } from '@/shared/global/globalPreferred'
import { computed, ref } from 'vue'

defineProps<{
  arenas: { region: string, battleMode: string, battleGameplay: string, tag: string, name: string, gameVersion: string, season: string }[],
  visibleModal: boolean
}>()

const searchText = ref('')
const season = ref<'winter' | 'summer' | 'desert' | null>(null)
const onlyActual = ref(true)

const canReset = computed(() => searchText.value.length > 0 || season.value !== null || onlyActual.value == false)

const emit = defineEmits<{
  (e: 'close'): void
}>()

function reset() {
  searchText.value = ''
  season.value = null
  onlyActual.value = true
}

function selectSeason(target: 'winter' | 'summer' | 'desert' | null) {
  if (season.value === target) season.value = null
  else season.value = target
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

  .season-select,
  .checkbox-section,
  .game-select,
  .filter {
    display: contents;
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

  .checkbox {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;

    input {
      margin: 0;
      width: 14px;
      height: 14px;
      cursor: pointer;
      accent-color: var(--blue-thin-color);
    }
  }

  .reset-container {

    display: contents;

    .reset {
      border: none;
      border-radius: 20px;
      background-color: rgba(255, 255, 255, 0.08);
      transition: background-color 0.2s, opacity 0.2s;
      padding: 0;
      height: 23px;
      width: 23px;
      min-width: 23px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      color: rgba(255, 255, 255, 0.9);

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }

    >* {
      transition: opacity 0.2s;
    }

    &.disabled {
      >* {
        opacity: 0;
        pointer-events: none;
      }
    }
  }

  .search-container {
    display: flex;
    align-items: center;
    gap: 5px;

    .game-select {
      display: none;
    }
  }

  @media screen and (max-width: 720px) {
    flex-direction: column;
    align-items: normal;

    .search-container {
      display: flex;
      gap: 5px;
      align-items: center;

      .search-line {
        width: 100%;
      }

      .game-select {
        display: contents;
      }
    }

    .filter {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 5px;

      .vr:first-child,
      .vr:last-child {
        display: none;
      }
    }

    &>.game-select {
      display: none;
    }
  }

  @media screen and (max-width: 500px) {
    .filter {
      flex-direction: column;

      .vr {
        display: none;
      }

      .season-select {
        display: flex;
        gap: 5px;
        width: 100%;

        * {
          flex: 1;
        }
      }

      .checkbox-section {
        width: 100%;
        display: flex;
        align-items: center;
      }
    }

  }
}
</style>