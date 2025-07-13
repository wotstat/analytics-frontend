<template>
  <div class="page">
    <h1>Установка модов WotStat</h1>
    <p>Вы можете установить моды прямо через браузерный веб-установщик или скачать файлами и установить вручную.</p>

    <div class="space"></div>

    <div class="select-folder card" v-if="isBrowserSupported && !gameInfo">
      <div class="flex">
        <div class="flex-1">
          <h3>Предоставьте доступ к папке с игрой</h3>
          <p>Необходимо выбрать папку в которую установленна игра</p>
        </div>

        <div class="select">
          <button @click="selectFolder">Выбрать</button>
        </div>
      </div>
    </div>

    <div class="select-folder-unsupported" v-if="!isBrowserSupported">
      <h3>Ваш браузер не поддерживается</h3>
      <p>Попробуйте Chrome 86+, Edge 86+, Opera 72+. Firefox и Safari пока не поддерживаются</p>
    </div>

    <div class="game-info card" v-if="gameInfo">
      <div class="flex">
        <div class="logo-container">
          <MTLogo class="logo mt" v-if="gameInfo.realm == 'RU' || gameInfo.realm == 'RPT'" />
          <WOTLogo class="logo wot" v-else />
        </div>
        <div class="info">
          <MTName class="logo-name mt" v-if="gameInfo.realm == 'RU' || gameInfo.realm == 'RPT'" />
          <WOTName class="logo-name wot" v-else />
          <p class="version">
            <span>{{ gameInfo.version }}</span>
            <span class="bullet">•</span>
            <span v-if="gameInfo.modsSet.size">Установлено модов: {{ gameInfo.modsSet.size }}</span>
          </p>
        </div>

        <div class="change">
          <button @click="selectFolder">Выбрать другую</button>
        </div>
      </div>
    </div>

    <div class="space"></div>

    <h4>Основные моды</h4>
    <div class="main-mods">
      <ModCard title="Виджеты" description="Модификация позволяет добавлять веб-виджеты прямо в игру."
        :image="EyeMarker" :model-value="enabledMods.get('wotstat.widgets') ?? false"
        @update:model-value="v => enabledMods.set('wotstat.widgets', v)" />
      <ModCard title="Аналитика" description="Собирается аналитические данные и отправляет их в базу данных WotStat."
        :image="EyeMarker" :model-value="enabledMods.get('wotstat.analytics') ?? false"
        @update:model-value="v => enabledMods.set('wotstat.analytics', v)" />
      <ModCard title="Позиции" description="Отображает эффективные позиции для каждого танка на каждой карте."
        :image="EyeMarker" :model-value="enabledMods.get('wotstat.positions') ?? false"
        @update:model-value="v => enabledMods.set('wotstat.positions', v)" />
    </div>

    <div class="large-space"></div>

    <div class="other-mods">

      <div class="line flex">
        <h4 class="flex-1">Другие моды</h4>
        <div class="switcher">
          <button class="detail" @click="displayType = 'detail'" :class="{ active: displayType === 'detail' }">
            <SidebarIcon />
          </button>
          <button class="table" @click="displayType = 'table'" :class="{ active: displayType === 'table' }">
            <ListIcon />
          </button>
        </div>
      </div>

      <table v-if="displayType === 'table'">
        <thead>
          <tr>
            <td></td>
            <td>Название</td>
            <td>Автор</td>
            <td>Описание</td>
            <td>Версия</td>
            <td>Источник</td>
          </tr>
        </thead>

        <tbody>
          <tr v-for="mod in otherMods.filter(m => latestMods.has(m.tag))"
            @click="enabledMods.set(mod.tag, !enabledMods.get(mod.tag))">
            <td>
              <input type="checkbox" :checked="enabledMods.get(mod.tag)"
                @change="enabledMods.set(mod.tag, !enabledMods.get(mod.tag))" @click.stop />
            </td>
            <td>{{ t(`name:${mod.tag}`) }}</td>
            <td>{{ t(`author:${mod.tag}`) }}</td>
            <td>{{ t(`description:${mod.tag}`) }}</td>
            <td>{{ latestMods.get(mod.tag)?.version ?? '?' }}</td>
            <td>
              <a :href="mod.source.url" target="_blank" rel="noopener noreferrer" @click.stop>{{ mod.source.name }}</a>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="detailed">
        <div class="list">
          <div class="element" v-for="mod in otherMods.filter(m => latestMods.has(m.tag))">
            {{ t(`name:${mod.tag}`) }}
          </div>
        </div>
        <div class="detail"></div>
      </div>
    </div>


    <div class="large-space"></div>

    <div class="install-footer">
      <button @click="install">Установить</button>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useInstaller } from './installer';
import MTLogo from './assets/mt-logo.svg';
import WOTLogo from './assets/wot-logo.svg';
import MTName from './assets/mt-name.svg';
import WOTName from './assets/wot-name.svg';
import ListIcon from "./assets/list.svg";
import SidebarIcon from "./assets/sidebar.svg";

import EyeMarker from './assets/mods/eye-marker-install.webp'
import ModCard from './ModCard.vue';
import { computed, ref, watch } from 'vue';
import { lestaLatestMods, otherMods, wotLatestMods } from './mods'
import { useI18n } from '@/composition/useI18n';
import i18n from './i18n.json';
import { useLocalStorage } from '@vueuse/core';

const displayType = ref<'detail' | 'table'>('table')
const preferredGameVendor = ref<'lesta' | 'wargaming'>('lesta')
const enabledMods = useLocalStorage('install:enabledMods', new Map<string, boolean>())

const { t } = useI18n(i18n)

const { isBrowserSupported, requestGameFolderAccess, gameInfo, installMods } = useInstaller()

watch(gameInfo, info => {
  if (!info) return;
  if (info.realm === 'RU' || info.realm === 'RPT') preferredGameVendor.value = 'lesta';
  else preferredGameVendor.value = 'wargaming';
});

const latestMods = computed(() => preferredGameVendor.value === 'lesta' ? lestaLatestMods.value : wotLatestMods.value);


async function selectFolder() {
  await requestGameFolderAccess()
}

async function install() {
  installMods()
}

</script>


<style lang="scss" scoped>
.page {
  max-width: 1000px;
  margin: auto;
  padding: 1rem;

  h3 {
    margin: 0;
  }

  h4 {
    margin: 0.5rem 0;
  }

  .space {
    margin: 1rem 0;
  }

  .large-space {
    margin: 3rem 0;
  }

  .select-folder {
    .select {
      display: flex;
      align-items: flex-end;
    }
  }

  .game-info {

    .logo-container {
      width: 40px;

      .logo {
        display: block;
      }
    }

    .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;

      .logo-name {
        height: 25px;
      }

      .version {
        line-height: 0.8;

        .bullet {
          margin: 0 0.8em;
          color: #888;
        }
      }
    }

    .change {
      display: flex;
      align-items: flex-end;
    }
  }

  .main-mods {
    display: flex;
    gap: 1em;

    .mod {
      flex: 1;
      padding: 0;

      .image {
        height: 200px;
        border-top-left-radius: 15px;
        border-top-right-radius: 15px;
        overflow: hidden;
        border-left: 1px solid #353535;
        border-right: 1px solid #353535;
        border-top: 1px solid #353535;

        img {
          display: block;
          width: 100%;
          height: 100%;
          scale: 1.02;
          object-fit: cover;
        }
      }

      .info {
        padding: 1em;

        .header {
          display: flex;
          align-items: center;

          h5 {
            font-size: 1em;
            flex: 1;
          }

          .github {
            display: block;
            width: 20px;
            height: 20px;
          }
        }
      }
    }

    @media screen and (max-width: 800px) {
      flex-direction: column;
      gap: 2em
    }
  }

  .other-mods {
    table {
      width: 100%;
      border-collapse: collapse;

      thead {
        td {
          padding: 0.5em;
          font-weight: bold;
          text-align: left;
          font-size: 0.9em;
        }
      }

      tbody {
        tr {
          cursor: pointer;

          &:hover {
            background: rgba(255, 255, 255, 0.05);

            td {
              border-bottom: 1px solid transparent !important;
            }
          }

          &:has(+tr:not(:hover)) {
            td {
              border-bottom: 1px solid #353535;
            }
          }
        }
      }

      tr {
        border-radius: 10px;

        td {
          padding: 0.7em 0.5em;
          border-bottom: 1px solid transparent;

          a {
            color: #4a90e2;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }

      td {
        &:first-child {
          padding-left: 0;
          padding-right: 0;
          border-top-left-radius: 10px;
          border-bottom-left-radius: 10px;
        }

        &:last-child {
          padding-right: 0;
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
        }
      }

      @media screen and (max-width: 800px) {
        td:nth-child(3) {
          display: none;
        }
      }

      @media screen and (max-width: 500px) {
        font-size: 0.9em;

        td:nth-child(5) {
          display: none;
        }
      }
    }

    input[type="checkbox"] {
      accent-color: #34ff59;
      margin-left: 0.9em;
      cursor: pointer;
    }

    .switcher {
      display: flex;
      align-items: center;

      button {
        background: transparent;
        border: none;
        padding: 6px;

        svg {
          width: 25px;
          fill: currentColor;
          display: block;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        &.active {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }

  .install-footer {
    position: sticky;
    bottom: 10px;
    background: #353535;
    padding: 1em;
    z-index: 100;
    border-radius: 15px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }
}
</style>