<template>
  <div class="page">
    <h1>Установка модов</h1>
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

    <div class="select-folder-unsupported card" v-if="!isBrowserSupported">
      <h3>Ваш браузер не поддерживает веб-установку</h3>
      <p>Попробуйте Chrome 86+, Edge 86+, Opera 72+. Firefox и Safari пока не поддерживаются</p>
      <p>Вы всё ещё можете скачать моды архивом и установить их вручную</p>
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

    <div class="line flex main-mods-header">
      <h4 class="flex-1">Основные моды</h4>
      <button class="detail header-button" @click="">
        <Points />
      </button>
    </div>

    <div class="main-mods">
      <ModCard :image="[WidgetsMainScreen, WidgetsBackScreen]"
        :model-value="enabledMods.get('wotstat.widgets') ?? false"
        @update:model-value="v => enabledMods.set('wotstat.widgets', v)">
        <template #info>
          <div class="header">
            <h5>Виджеты</h5>
            <a href="https://github.com/wotstat/wotstat-widgets" target="_blank" class="circle" @click.stop>
              <Github class="github" />
            </a>
          </div>
          <p>Модификация позволяет добавлять веб-виджеты прямо в игру.</p>
          <div class="badges">
            <div class="badge blue" v-if="latestModsMap.get('wotstat.widgets')">v{{
              latestModsMap.get('wotstat.widgets')?.mtmod.version }}</div>
            <Download class="download" @click.stop />
          </div>
        </template>
      </ModCard>

      <ModCard :image="[AnalyticsMain, AnalyticsBack1, AnalyticsBack2]"
        :model-value="enabledMods.get('wotstat.analytics') ?? false"
        @update:model-value="v => enabledMods.set('wotstat.analytics', v)"> <template #info>
          <div class="header">
            <h5>Аналитика</h5>
            <a href="https://github.com/wotstat/wotstat-analytics" target="_blank" class="circle" @click.stop>
              <Github class="github" />
            </a>
          </div>
          <p>Собирается аналитические данные и отправляет их в базу данных WotStat.</p>
          <div class="badges">
            <div class="badge blue" v-if="latestModsMap.get('wotstat.analytics')">v{{
              latestModsMap.get('wotstat.analytics')?.mtmod.version }}</div>
            <Download class="download" @click.stop />
          </div>
        </template>
      </ModCard>

      <ModCard :image="[EyeMarkerMain, EyeMarkerBack]" :model-value="enabledMods.get('wotstat.positions') ?? false"
        @update:model-value="v => enabledMods.set('wotstat.positions', v)"> <template #info>
          <div class="header">
            <h5>
              <a :href="POSITIONS_URL" target="_blank" rel="noopener noreferrer" @click.stop>
                Позиции
                <OpenExternal class="open-external" />
              </a>
            </h5>
            <a href="https://github.com/wotstat/wotstat-positions" target="_blank" class="circle" @click.stop>
              <Github class="github" />
            </a>
          </div>
          <p>Отображает эффективные позиции для каждого танка на каждой карте.</p>
          <div class="badges">
            <div class="badge blue" v-if="latestModsMap.get('wotstat.positions')">v{{
              latestModsMap.get('wotstat.positions')?.mtmod.version }}</div>
            <div class="badge yellow">Необходима лицензия</div>
            <Download class="download" @click.stop />
          </div>
        </template>
      </ModCard>
    </div>

    <div class="large-space"></div>

    <div class="other-mods" v-if="displayedModsList.length > 0">

      <div class="line flex">
        <h4 class="flex-1">Другие моды</h4>
        <div class="switcher">
          <button class="detail header-button" @click="displayType = 'detail'"
            :class="{ active: displayType === 'detail' }">
            <SidebarIcon />
          </button>
          <button class="table header-button" @click="displayType = 'table'"
            :class="{ active: displayType === 'table' }">
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
          <tr v-for="mod in displayedModsList" @click="toggleMod(mod.tag)">
            <td>
              <SmallCheckbox class="checkbox" :model-value="enabledMods.get(mod.tag) || dependencies.has(mod.tag)"
                :class="{ 'is-dependency': dependencies.has(mod.tag) }" @update:model-value="toggleMod(mod.tag)"
                @click.stop />
            </td>
            <td>
              {{ t(`name:${mod.tag}`) }}
            </td>
            <td>{{ t(`author:${mod.tag}`) }}</td>
            <td>
              {{ t(`description:${mod.tag}`) }}
              <div class="badge" v-if="mod.support">{{ mod.support == 'mt-only' ? 'Только Lesta' : 'Только WG' }}</div>
            </td>
            <td>{{ mod.version }}</td>
            <td>
              <a :href="mod.source.url" target="_blank" rel="noopener noreferrer" @click.stop>{{ mod.source.name }}</a>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="detailed">
        <div class="info">
          <div class="list">
            <template v-for="mod in displayedModsList">
              <div class="element" @click="toggleMod(mod.tag)" @pointerover="selectedModInDetail = mod"
                :class="{ selected: selectedModInDetail?.tag === mod.tag }">
                <SmallCheckbox class="checkbox" :class="{ 'is-dependency': dependencies.has(mod.tag) }"
                  :model-value="enabledMods.get(mod.tag) || dependencies.has(mod.tag)"
                  @update:model-value="toggleMod(mod.tag)" />
                {{ t(`name:${mod.tag}`) }}
              </div>
              <div class="separator"></div>
            </template>
          </div>
        </div>
        <div class="detail nice-scrollbar" ref="detailContentContainer" :class="{ 'has-scroll': hasScrollY }">
          <div class="markdown">
            <component :is="detailComponent" v-if="detailComponent" />
            <div v-else>
              {{ selectedModInDetail }}
            </div>
          </div>
          <div class="footer-info" v-if="selectedModInDetail">
            <p>
              <span>{{ t(`author:${selectedModInDetail.tag}`) }}</span>
              <span> • </span>
              <a :href="selectedModInDetail.source.url" target="_blank" rel="noopener noreferrer" @click.stop>{{
                selectedModInDetail.source.name }}</a>
              <span> • </span>
              <span>v{{ selectedModInDetail.version }} ({{ selectedModInDetail.date }})</span>

              <template v-if="selectedModInDetail.support == 'mt-only'">
                <span> • </span>
                <span class="bold">Только Lesta</span>
              </template>

              <template v-if="selectedModInDetail.support == 'wot-only'">
                <span> • </span>
                <span class="bold">Только WG</span>
              </template>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="large-space"></div>

    <div class="install-footer">
      {{ preferredGameVendor }}
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
import Github from './assets/github.svg'
import OpenExternal from './assets/open-external.svg';
import Download from './assets/download.svg';
import Points from './assets/points.svg';



import WidgetsMainScreen from './assets/mods/widgets-layer-main.png'
import WidgetsBackScreen from './assets/mods/widgets-layer-back.png'


import EyeMarkerMain from './assets/mods/eye-marker-install-main.png'
import EyeMarkerBack from './assets/mods/eye-marker-install-back.png'


import AnalyticsMain from './assets/mods/analytics-main.png'
import AnalyticsBack1 from './assets/mods/analytics-back-1.png'
import AnalyticsBack2 from './assets/mods/analytics-back-2.png'

import ModCard from './ModCard.vue';
import { type Component, computed, ref, watch } from 'vue';
import { latestMods, latestModsMap, lestaLatestMods, ModInfo, otherMods, otherModsMap, wotLatestMods, } from './mods'
import { useI18n } from '@/composition/useI18n';
import i18n from './i18n.json';
import { useLocalStorage } from '@vueuse/core';
import { useHasScroll } from '@/composition/useHasScroll';
import SmallCheckbox from './SmallCheckbox.vue';
import { POSITIONS_URL } from '@/utils/externalUrl';

const detailContentContainer = ref<HTMLElement | null>(null);
const displayType = useLocalStorage<'detail' | 'table'>('install:otherModsDisplayType', 'table')
const preferredGameVendor = ref<'lesta' | 'wargaming' | 'unknown'>('unknown')
const enabledMods = useLocalStorage('install:enabledMods', new Map<string, boolean>())
const selectedModInDetail = ref<(ModInfo & { version: string, date: string }) | null>(null);

const { hasScrollY } = useHasScroll(detailContentContainer);

const { t } = useI18n(i18n)

const { isBrowserSupported, requestGameFolderAccess, gameInfo, installMods } = useInstaller()

watch(gameInfo, info => {
  if (!info) return preferredGameVendor.value = 'unknown';
  if (info.realm === 'RU' || info.realm === 'RPT') preferredGameVendor.value = 'lesta';
  else preferredGameVendor.value = 'wargaming';
}, { immediate: true });

const displayedModsList = computed(() => {
  return otherMods
    .filter(m =>
      (m.support == 'mt-only' && preferredGameVendor.value === 'lesta') ||
      (m.support == 'wot-only' && preferredGameVendor.value === 'wargaming') ||
      (m.support == undefined) ||
      (preferredGameVendor.value == 'unknown'))
    .map(m => {
      const latestMod = latestModsMap.value.get(m.tag);
      if (!latestMod) return null;

      const target = latestMod[preferredGameVendor.value == 'wargaming' ? 'wotmod' : 'mtmod'];

      return {
        ...m,
        version: target.version,
        date: target.date,
      };
    })
    .filter(m => m !== null);
})

const unwatch = watch(displayedModsList, mods => {
  if (mods.length === 0) return;
  if (!selectedModInDetail.value) selectedModInDetail.value = mods.at(0) || null;
  if (selectedModInDetail.value) unwatch();
});

const mdDescriptions = import.meta.glob<{ VueComponent: Component }>('./details/*/*.md', { eager: true });
const detailComponent = computed(() => {
  if (!selectedModInDetail.value) return null;
  const modTag = selectedModInDetail.value.tag;
  const path = `./details/ru/${modTag}.md`;
  return mdDescriptions[path]?.VueComponent || null;
});

const dependencies = computed(() => {
  return dependenciesForMods([...enabledMods.value.entries()]
    .filter(([k, v]) => v)
    .map(([k, v]) => k)
  );
});

function dependenciesForMods(mods: string[]) {
  const dependencies = new Set<string>();
  const stack = [mods];

  while (stack.length > 0) {
    const current = stack.pop() || [];
    for (const dep of current) {
      if (!dependencies.has(dep)) {
        dependencies.add(dep);
        const depInfo = otherModsMap.get(dep);
        if (depInfo && depInfo.required) {
          stack.push(depInfo.required);
        }
      }
    }
  }

  for (const mod of mods) dependencies.delete(mod)

  return dependencies
}

function toggleMod(tag: string) {
  enabledMods.value.set(tag, !enabledMods.value.get(tag))
}

async function selectFolder() {
  await requestGameFolderAccess()
}

async function install() {
  installMods()
}

</script>


<style lang="scss" scoped>
.main-mods {
  .header {
    display: flex;
    align-items: center;

    h5 {
      margin: 0;
      font-size: 1em;
      flex: 1;
    }

    a {
      color: white;

      .open-external {
        width: 13px;
        height: 13px;
        display: inline-block;
        fill: currentColor;
        margin-left: 0.2em;
        margin-bottom: -0.05em;
        color: #ffffffd9;
      }

      &:hover {
        text-decoration: underline;

        .open-external {
          color: #ffffff;
        }
      }
    }

    a.circle {
      color: white;
      transition: filter 0.2s ease-out;

      svg {
        position: relative;
        z-index: 1;
      }

      &:hover {
        position: relative;

        &::before {
          content: '';
          background-color: rgba(255, 255, 255, 0.1);
          position: absolute;
          inset: -6px;
          border-radius: 50%;
        }
      }
    }

    .github {
      display: block;
      width: 20px;
      height: 20px;
    }

  }

  .badges {
    margin-top: 0.5em;
    margin-bottom: -0.5em;
    display: flex;
    align-items: center;
    gap: 0.5em;
    flex-wrap: wrap;

    .badge {
      padding: 0.2em 0.5em;
      border-radius: 5px;
      font-size: 0.8em;
      font-weight: bold;
      line-height: 1.2;

      white-space: nowrap;

      &.blue {
        background-color: #2081f1;
        color: white;
      }

      &.yellow {
        background-color: #9a00c9;
        color: white;
      }
    }

    .download {
      width: 20px;
      height: 20px;
      display: block;
      fill: rgb(255, 255, 255);
      cursor: pointer;
      transition: filter 0.2s ease-out;
      padding: 5px;
      margin: -5px;
      margin-left: auto;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
      }
    }
  }
}


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

  button.header-button {
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

  .main-mods-header {
    align-items: center;

    .header-button {
      padding: 0 6px;
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

        .badge {
          float: right;
          padding: 0.2em 0.5em;
          background-color: #4a90e2;
          color: white;
          border-radius: 5px;
          margin-top: 0.2em;
          font-size: 0.8em;
          margin-left: 0.5em;
          font-weight: bold;
          line-height: 1.2;
        }
      }

      .checkbox {
        --accent-color: #34ff59;
        margin-left: 0.9em;
        cursor: pointer;
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

    .switcher {
      display: flex;
      align-items: center;

      button {
        &.active {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }

    .detailed {
      display: flex;
      gap: 1em;
      margin-top: 1em;

      .info {
        width: 30%;
        min-width: 200px;

        .list {
          display: flex;
          flex-direction: column;
          position: sticky;
          top: calc(var(--header-height) + 20px);

          .element {
            border-radius: 10px;
            padding: 0.7em 1em;
            cursor: pointer;
            user-select: none;

            .checkbox {
              --accent-color: #34ff59;
              margin-left: -0.2em;
              margin-right: 0.4em;
              cursor: pointer;
            }

            &.selected {
              background-color: rgba(255, 255, 255, 0.05);
            }

            &:hover {
              background-color: rgba(255, 255, 255, 0.05);
            }

            &.selected,
            &:hover {
              &+.separator {
                background-color: transparent;
              }
            }
          }

          .separator {
            background-color: #ffffff18;
            height: 1px;
            margin: 0;
            margin-bottom: -1px;

            &:last-child {
              display: none;
            }

            &:has(+.element:hover),
            &:has(+.element.selected) {
              background-color: transparent;
            }

          }
        }
      }

      .detail {
        flex: 1;
        height: 800px;
        overflow-y: auto;

        &.has-scroll {
          padding-right: 5px;
        }

        :deep(.markdown) {
          h1 {
            margin-top: 0;
          }

          blockquote {
            background-color: rgba(255, 255, 255, 0.04);
          }
        }

        .footer-info {
          border-top: 1px solid #353535;
          background-color: var(--background-color);
          position: sticky;
          bottom: 0;
          margin-top: 1em;
          padding-top: 1em;
        }
      }
    }

    .checkbox.is-dependency {
      opacity: 0.4;
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