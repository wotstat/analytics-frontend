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
        :image="EyeMarker" v-model="installWidgets" />
      <ModCard title="Аналитика" description="Собирается аналитические данные и отправляет их в базу данных WotStat."
        :image="EyeMarker" v-model="installAnalytics" />
      <ModCard title="Позиции" description="Отображает эффективные позиции для каждого танка на каждой карте."
        :image="EyeMarker" v-model="installPositions" />
    </div>

    <div class="large-space"></div>

    <div class="other-mods">
      <h4>Другие моды</h4>

      <table>
        <thead>
          <td></td>
          <td>Название</td>
          <td>Автор</td>
          <td>Описание</td>
          <td>Версия</td>
          <td>Источник</td>
        </thead>

        <tbody>
          <tr>
            <td>
              <input type="checkbox">
            </td>
            <td>Меню модов</td>
            <td>@poliroid</td>
            <td>Добавляет в ангар кнопку через которую открываются другие моды</td>
            <td>1.6.01</td>
            <td>
              <a href="https://gitlab.com/wot-public-mods/mods-list/-/releases" target="_blank"
                rel="noopener noreferrer">GitLab
              </a>
            </td>
          </tr>

          <tr>
            <td>
              <input type="checkbox">
            </td>
            <td>Настройки модов</td>
            <td>@IzeBerg</td>
            <td>Добавляет интерфейс для настроек модов</td>
            <td>1.6.3</td>
            <td>
              <a href="https://github.com/IzeBerg/modssettingsapi/" target="_blank" rel="noopener noreferrer">GitHub
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="space"></div>

    <div class="utils">
      <h4>Служебные моды</h4>
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
import Github from "./assets/github.svg";

import EyeMarker from './assets/mods/eye-marker-install.webp'
import ModCard from './ModCard.vue';
import { ref } from 'vue';

const installWidgets = ref(false)
const installAnalytics = ref(true)
const installPositions = ref(false)

const { isBrowserSupported, requestGameFolderAccess, gameInfo, installMods } = useInstaller()

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
    }

    input[type="checkbox"] {
      accent-color: #34ff59;
      margin-left: 0.9em;
      cursor: pointer;
    }
  }

  .install-footer {
    position: sticky;
    bottom: 10px;
    background: #353535;
    padding: 1em;
    z-index: 100;
    border-radius: 15px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    margin: 0 -20px;
  }
}
</style>