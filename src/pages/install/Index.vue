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
          <button @click="selectFolder" class="primary">Выбрать</button>
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
          <div class="version">
            <span>{{ gameInfo.version }}</span>
            <div class="badge" v-if="latestGameVersion && gameInfo.version !== (gameVendor(gameInfo.realm) == 'lesta' ? latestGameVersion.lesta.version :
              latestGameVersion.wargaming.version)">
              <ArrowRight /> {{ gameVendor(gameInfo.realm) == 'lesta' ? latestGameVersion.lesta.version :
                latestGameVersion.wargaming.version }}
            </div>
            <template v-if="gameInfo.modsSet.size">
              <span class="bullet">•</span>
              <span>Установлено модов: {{ gameInfo.modsSet.size }}</span>
            </template>
          </div>
        </div>
      </div>

      <button class="close" @click="close">
        <XIcon />
      </button>
    </div>

    <template v-if="!gameInfo">
      <div class="space"></div>
      <h4 class="flex-1">Предпочитаемая игра</h4>
      <div class="preferred-game">
        <div class="switcher">
          <button class="mt" :class="{ active: preferredGameVendor === 'lesta' }"
            @click="preferredGameVendor = 'lesta'">
            <MTName class="logo-name" />
            <MTLogo class="logo" />
          </button>
          <button class="divider" :class="{ active: preferredGameVendor === 'unknown' }"
            @click="preferredGameVendor = 'unknown'">/</button>
          <button class="wot" :class="{ active: preferredGameVendor === 'wargaming' }"
            @click="preferredGameVendor = 'wargaming'">
            <WOTLogo class="logo" />
            <WOTName class="logo-name" />
          </button>
        </div>

        <div class="version-info" v-if="latestGameVersion && preferredGameVendor !== 'unknown'">
          {{ preferredGameVendor == 'lesta' ? latestGameVersion.lesta.version : latestGameVersion.wargaming.version }}
        </div>
      </div>
    </template>


    <div class="space"></div>

    <div class="line flex main-mods-header">
      <h4 class="flex-1">Основные моды</h4>
      <button class="detail header-button" @click="t => showContextMenu(t.currentTarget as HTMLElement)">
        <Points />
      </button>
    </div>

    <div class="main-mods">
      <ModCard :image="[WidgetsMainScreen, WidgetsBackScreen]"
        :model-value="enabledMods.get('wotstat.widgets') ?? false"
        :latest-version="version('wotstat.widgets') ?? undefined"
        :installed-version="checkedMods.get('wotstat.widgets')"
        @update:model-value="v => enabledMods.set('wotstat.widgets', v)" :prevent-effects="anyPopupShown"
        ref="widgetsModCard">
        <template #info>
          <div class="header">
            <h5>Виджеты</h5>
            <a href="https://github.com/wotstat/wotstat-widgets" target="_blank" class="circle" @click.stop>
              <Github class="github" />
            </a>
          </div>
          <p>Модификация позволяет добавлять веб-виджеты прямо в игру.</p>
          <div class="badges">
            <div class="badge blue" v-if="version('wotstat.widgets')"> v{{ version('wotstat.widgets') }}</div>
            <Download class="download" @click.stop="e => onClickDownload(e, 'wotstat.widgets')" />
          </div>
        </template>
      </ModCard>

      <ModCard :image="[AnalyticsMain, AnalyticsBack1, AnalyticsBack2]"
        :model-value="enabledMods.get('wotstat.analytics') ?? false"
        :latest-version="version('wotstat.analytics') ?? undefined"
        :installed-version="checkedMods.get('mod.wotStat') ?? undefined"
        @update:model-value="v => enabledMods.set('wotstat.analytics', v)" :prevent-effects="anyPopupShown"
        ref="analyticsModCard">
        <template #info>
          <div class="header">
            <h5>Аналитика</h5>
            <a href="https://github.com/wotstat/wotstat-analytics" target="_blank" class="circle" @click.stop>
              <Github class="github" />
            </a>
          </div>
          <p>Собирается аналитические данные и отправляет их в базу данных WotStat.</p>
          <div class="badges">
            <div class="badge blue" v-if="version('wotstat.analytics')">v{{ version('wotstat.analytics') }}</div>
            <Download class="download" @click.stop="e => onClickDownload(e, 'wotstat.analytics')" />
          </div>
        </template>
      </ModCard>

      <ModCard :image="[EyeMarkerMain, EyeMarkerBack]" :model-value="enabledMods.get('wotstat.positions') ?? false"
        :latest-version="version('wotstat.positions') ?? undefined"
        :installed-version="checkedMods.get('wotstat.positions') ?? undefined"
        @update:model-value="v => enabledMods.set('wotstat.positions', v)" :prevent-effects="anyPopupShown"
        ref="positionsModCard">
        <template #info>
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
            <div class="badge blue" v-if="version('wotstat.positions')">v{{ version('wotstat.positions') }}</div>
            <div class="badge yellow">Необходима лицензия</div>
            <Download class="download" @click.stop="e => onClickDownload(e, 'wotstat.positions')" />
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
            <td></td>
          </tr>
        </thead>

        <tbody>
          <tr v-for="mod in displayedModsList" @click="toggleMod(mod.tag)" :class="`mod-${mod.tag.replace('.', '-')}`">
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
              <div class="badge" v-if="mod.support && (preferredGameVendor == 'unknown' ||
                preferredGameVendor == 'wargaming' && mod.support == 'mt-only' ||
                preferredGameVendor == 'wargaming' && mod.support == 'wot-only')">
                {{ mod.support == 'mt-only' ? 'Только Lesta' : 'Только WG' }}
              </div>

              <div class="badge" v-if="preferredGameVendor != 'unknown' && canUpdate(mod.tag)">
                {{ checkedMods.get(mod.tag) }}
                <ArrowRight class="arrow-right" />
              </div>
              <div class="badge green" v-else-if="checkedMods.get(mod.tag)">
                <CheckmarkShield class="checkmark-shield" />
              </div>
            </td>
            <td>{{ mod.version }}</td>
            <td>
              <a :href="mod.source.url" target="_blank" rel="noopener noreferrer" @click.stop>{{ mod.source.name }}</a>
            </td>
            <td>
              <Download class="download" @click.stop="e => onClickDownload(e, mod.tag)" />
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="detailed">
        <div class="info">
          <div class="list">
            <template v-for="mod in displayedModsList">
              <div class="element" @click="selectedModInDetail = mod"
                :class="{ selected: selectedModInDetail?.tag === mod.tag, [`mod-${mod.tag.replace('.', '-')}`]: true }">
                <SmallCheckbox class="checkbox" :class="{ 'is-dependency': dependencies.has(mod.tag) }"
                  :model-value="enabledMods.get(mod.tag) || dependencies.has(mod.tag)"
                  @update:model-value="toggleMod(mod.tag)" @click.stop />
                {{ t(`name:${mod.tag}`) }}
                <div class="badges">
                  <div class="can-update" v-if="preferredGameVendor != 'unknown' && canUpdate(mod.tag)"></div>
                  <div class="badge green" v-else-if="checkedMods.get(mod.tag)">
                    <CheckmarkShield class="checkmark-shield" />
                  </div>
                </div>
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
              <span v-if="!canUpdate(selectedModInDetail.tag)">v{{ selectedModInDetail.version }} ({{
                selectedModInDetail.date }})</span>
              <span v-else class="update-badge">
                Можно обновить
                {{ checkedMods.get(selectedModInDetail.tag) }}
                <ArrowRight class="arrow-right" />
                {{ selectedModInDetail.version }}
              </span>

              <template v-if="!canUpdate(selectedModInDetail.tag) && checkedMods.get(selectedModInDetail.tag)">
                <span> • </span>
                <span class="already-installed">Установлен</span>
              </template>

              <template v-if="preferredGameVendor == 'unknown' && selectedModInDetail.support == 'mt-only'">
                <span> • </span>
                <span class="bold">Только Lesta</span>
              </template>

              <template v-if="preferredGameVendor == 'unknown' && selectedModInDetail.support == 'wot-only'">
                <span> • </span>
                <span class="bold">Только WG</span>
              </template>
            </p>

            <Download class="download" @click.stop="e => onClickDownload(e, selectedModInDetail!.tag)" />
          </div>
        </div>
      </div>
    </div>

    <div class="large-space"></div>

    <div class="install-footer">
      <div class="info">
        <h4>Информация о модах</h4>
        <p v-if="latestMods.isFetching.value">Загрузка...</p>
        <p v-else-if="!latestMods.error.value">
          <span v-if="targetInstallMods.length > 0">
            Выбрано модов <span class="badge"> {{ targetInstallMods.length }}</span>.
          </span>
          <span v-else>Не выбрано ни одного мода.</span>

          <span v-if="gameInfo == null && isBrowserSupported">
            Для установки необходимо <a @click="selectFolder">выбрать</a> папку с игрой.
          </span>
        </p>
        <p v-else>
          Ошибка при загрузке списка модов. Попробуйте обновить страницу или попробовать позже.
        </p>
      </div>
      <div class="buttons">
        <button @click="downloadArchive" class="secondary"
          :disabled="targetInstallMods.length === 0 || latestMods.isFetching.value">Скачать
          архив</button>
        <button @click="install" class="primary"
          :disabled="gameInfo == null || targetInstallMods.length === 0 || latestMods.isFetching.value">Установить</button>
      </div>
    </div>

    <ExportArchive v-if="downloadPopupShown" @close="downloadPopupShown = false" :mods="targetInstallMods"
      :vendor="preferredGameVendor == 'unknown' ? 'lesta' : preferredGameVendor" />

    <InstallMods v-if="installPopupShown" @close="installPopupShown = false" :mods="targetInstallMods"
      :install-mod="installMod" :vendor="preferredGameVendor == 'unknown' ? 'lesta' : preferredGameVendor" />

    <SelectFolderError v-if="selectFolderErrorRootHandle" :handle="selectFolderErrorRootHandle"
      @close="selectFolderErrorRootHandle = null" />
  </div>
</template>


<script setup lang="ts">
import { dotSeparatedCompare, gameVendor, useInstaller } from './utils/installer'
import MTLogo from './assets/mt-logo.svg'
import WOTLogo from './assets/wot-logo.svg'
import MTName from './assets/mt-name.svg'
import WOTName from './assets/wot-name.svg'
import ListIcon from './assets/list.svg'
import SidebarIcon from './assets/sidebar.svg'
import Github from './assets/github.svg'
import OpenExternal from './assets/open-external.svg'
import Download from './assets/download.svg?component'
import Points from './assets/points.svg'
import ArrowRight from './assets/arrow-right.svg'
import CheckmarkShield from './assets/checkmark-shield.svg'
import XIcon from '@/assets/icons/x.svg'



import WidgetsMainScreen from './assets/mods/widgets-layer-main.webp'
import WidgetsBackScreen from './assets/mods/widgets-layer-back.webp'

import EyeMarkerMain from './assets/mods/eye-marker-install-main.webp'
import EyeMarkerBack from './assets/mods/eye-marker-install-back.webp'

import AnalyticsMain from './assets/mods/analytics-main.webp'
import AnalyticsBack1 from './assets/mods/analytics-back-1.webp'
import AnalyticsBack2 from './assets/mods/analytics-back-2.webp'


import ModCard from './components/ModCard.vue'
import { type Component, computed, nextTick, onMounted, ref, watch } from 'vue'
import { analyticsMod, latestMods, latestModsMap, ModInfo, otherMods, otherModsMap, positionsMod, widgetsMod, } from './mods/mods'
import { useI18n } from '@/composition/useI18n'
import i18n from './mods/i18n.json'
import { useLocalStorage } from '@vueuse/core'
import { useHasScroll } from '@/composition/useHasScroll'
import SmallCheckbox from './components/SmallCheckbox.vue'
import { INSTALL_URL, POSITIONS_URL } from '@/utils/externalUrl'
import { showContextMenu } from './components/cardIntaractionControl'
import { button, simpleContextMenu } from '@/components/uiKit/contextMenu/simpleContextMenu'
import { latestGameVersion } from '@/utils/gameVersion'
import ExportArchive from './components/exportArchive/ExportArchive.vue'
import InstallMods from './components/InstallMods.vue'
import SelectFolderError from './components/SelectFolderError.vue'
import { showFocusEffect } from '@/pages/install/components/focusEffect/focusEffect'
import { useRoute } from 'vue-router'
import { setFeatureVisit } from '@/components/uiKit/newFeatureBadge/newFeatureBadge'

setFeatureVisit('mod-installer')


const detailContentContainer = ref<HTMLElement | null>(null)
const displayType = useLocalStorage<'detail' | 'table'>('install:otherModsDisplayType', 'table')
const preferredGameVendor = ref<'lesta' | 'wargaming' | 'unknown'>('unknown')
const enabledMods = useLocalStorage('install:enabledMods', new Map<string, boolean>())
const selectedModInDetail = ref<(ModInfo & { version: string, date: string }) | null>(null)
const selectFolderErrorRootHandle = ref<null | FileSystemDirectoryHandle>(null)

const { hasScrollY } = useHasScroll(detailContentContainer)

const { t } = useI18n(i18n)

const modsNames = [...otherMods, analyticsMod, widgetsMod, positionsMod].map(m => m.tag)
const { isBrowserSupported, requestGameFolderAccess, gameInfo, installMod, close, checkedMods } = useInstaller(modsNames)

watch(gameInfo, info => {
  if (!info) return preferredGameVendor.value = 'unknown'
  preferredGameVendor.value = gameVendor(info.realm)

}, { immediate: true })

const displayedModsList = computed(() => {
  return otherMods
    .filter(m =>
      (m.support == 'mt-only' && preferredGameVendor.value === 'lesta') ||
      (m.support == 'wot-only' && preferredGameVendor.value === 'wargaming') ||
      (m.support == undefined) ||
      (preferredGameVendor.value == 'unknown'))
    .map(m => {
      const latestMod = latestModsMap.value.get(m.tag)
      if (!latestMod) return null

      const target = latestMod[preferredGameVendor.value == 'wargaming' ? 'wotmod' : 'mtmod']

      return {
        ...m,
        version: target.version,
        date: target.date,
      }
    })
    .filter(m => m !== null)
})

if (displayedModsList.value.length == 0) {
  const unwatch = watch(displayedModsList, mods => {
    if (mods.length === 0) return
    if (!selectedModInDetail.value) selectedModInDetail.value = mods.at(0) || null
    if (selectedModInDetail.value) unwatch()
  })
} else {
  if (!selectedModInDetail.value) selectedModInDetail.value = displayedModsList.value.at(0) || null
}

const mdDescriptions = import.meta.glob<{ VueComponent: Component }>('./details/*/*.md', { eager: true })
const detailComponent = computed(() => {
  if (!selectedModInDetail.value) return null
  const modTag = selectedModInDetail.value.tag
  const path = `./details/ru/${modTag}.md`
  return mdDescriptions[path]?.VueComponent || null
})

const dependencies = computed(() => {
  return dependenciesForMods([...enabledMods.value.entries()]
    .filter(([k, v]) => v)
    .map(([k, v]) => k)
  )
})

const targetInstallMods = computed(() => {
  const targetMods = new Set<string>()
  for (const [tag, enabled] of enabledMods.value.entries()) if (enabled) targetMods.add(tag)
  for (const dep of dependencies.value) targetMods.add(dep)
  return [...targetMods.values()]
    .filter(tag => {
      const mod = otherModsMap.get(tag)
      if (!mod) return true

      const support = mod.support
      if (!support) return true

      if (preferredGameVendor.value === 'unknown') return true

      if (support === 'mt-only' && preferredGameVendor.value === 'lesta') return true
      if (support === 'wot-only' && preferredGameVendor.value === 'wargaming') return true

      return false
    })
})

function dependenciesForMods(mods: string[]) {
  const dependencies = new Set<string>()
  const stack = [mods]

  while (stack.length > 0) {
    const current = stack.pop() || []
    for (const dep of current) {
      if (!dependencies.has(dep)) {
        dependencies.add(dep)
        const depInfo = otherModsMap.get(dep)
        if (depInfo && depInfo.required) {
          stack.push(depInfo.required)
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

function version(tag: string) {
  const mod = latestModsMap.value.get(tag)
  if (!mod) return null

  return preferredGameVendor.value === 'wargaming' ? mod.wotmod.version : mod.mtmod.version
}

function canUpdate(tag: string) {
  const installedVersion = checkedMods.value.get(tag)
  const latestVersion = version(tag)

  if (!installedVersion || !latestVersion) return false
  return dotSeparatedCompare(installedVersion, latestVersion) === -1
}

async function selectFolder() {
  await requestGameFolderAccess(handle => {
    selectFolderErrorRootHandle.value = handle
  })
}

const installPopupShown = ref(false)
async function install() {
  installPopupShown.value = true
}

function onClickDownload(event: MouseEvent, tag: string) {
  const mod = latestModsMap.value.get(tag)
  if (!mod) return console.warn(`Mod ${tag} not found in latest mods`)

  function beginDownload() {
    if (preferredGameVendor.value === 'unknown') return console.warn('Game vendor is unknown, cannot download mod')
    if (!mod) return console.warn(`Mod ${tag} not found in latest mods`)

    const target = mod[preferredGameVendor.value == 'wargaming' ? 'wotmod' : 'mtmod']

    if (!target) return console.warn(`Mod ${tag} does not have a target for ${preferredGameVendor.value}`)

    const url = `${INSTALL_URL}/${target.url}`
    const a = document.createElement('a')
    a.href = url
    a.download = target.filename
    a.click()
  }

  if (preferredGameVendor.value === 'unknown') {

    simpleContextMenu({
      position: (event.currentTarget as HTMLElement).getBoundingClientRect(),
      alignY: 'bottom'
    }, [
      button('Lesta', () => {
        preferredGameVendor.value = 'lesta'
        beginDownload()
      }),
      button('Wargaming', () => {
        preferredGameVendor.value = 'wargaming'
        beginDownload()
      }),
    ])

    return
  }

  beginDownload()

}

const downloadPopupShown = ref(false)
function downloadArchive(event: MouseEvent) {

  function beginDownload() {
    downloadPopupShown.value = true
  }

  if (preferredGameVendor.value === 'unknown') {

    simpleContextMenu({
      position: { x: event.clientX, y: event.clientY }
    }, [
      button('Lesta', () => {
        preferredGameVendor.value = 'lesta'
        beginDownload()
      }),
      button('Wargaming', () => {
        preferredGameVendor.value = 'wargaming'
        beginDownload()
      }),
    ])

    return
  }

  beginDownload()
}

const anyPopupShown = computed(() => downloadPopupShown.value || installPopupShown.value || selectFolderErrorRootHandle.value !== null)


const route = useRoute()
const analyticsModCard = ref<InstanceType<typeof ModCard> | null>(null)
const widgetsModCard = ref<InstanceType<typeof ModCard> | null>(null)
const positionsModCard = ref<InstanceType<typeof ModCard> | null>(null)

function enableOnly(tags: string[]) {
  enabledMods.value.clear()
  for (const tag of tags) enabledMods.value.set(tag, true)
}

onMounted(() => {
  const { preset } = route.query

  if (!preset) return


  switch (preset) {
    case 'analytics':
      showFocusEffect(analyticsModCard.value?.$el as HTMLElement)
      enableOnly(['wotstat.analytics'])
      break

    case 'widgets':
      showFocusEffect(widgetsModCard.value?.$el as HTMLElement)
      enableOnly(['wotstat.widgets'])
      break

    case 'positions':
      showFocusEffect(positionsModCard.value?.$el as HTMLElement)
      enableOnly(['wotstat.positions', 'izeberg.modssettingsapi', 'me.poliroid.modslistapi'])
      break

    case 'settings':

      function focusAnim() {
        const element = document.querySelector('.mod-izeberg-modssettingsapi')
        if (!element) return

        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        enableOnly(['izeberg.modssettingsapi', 'me.poliroid.modslistapi'])
        setTimeout(() => showFocusEffect(element as HTMLElement), 300)
      }

      if (displayedModsList.value.length > 0) {
        focusAnim()
      } else {
        const unwatch = watch(() => displayedModsList.value, (mods) => {
          if (mods.length == 0) return
          unwatch()
          nextTick(() => focusAnim())
        })
      }
      break

    default:
      break
  }
})

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
      color: inherit;
      font-weight: bold;

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
        color: #ffffff;

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

      &.green {
        background-color: #2cb030;
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
  padding: 1em;
  padding-bottom: 10px;

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

      .primary {
        padding: 0.6em 1.2em;
      }
    }
  }

  .game-info {
    position: relative;

    .logo-container {

      .logo {
        height: 52.08px;
        display: block;
      }
    }

    .secondary {
      padding: calc(0.6em - 2px) 1.2em;
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

        .badge {
          padding: 0.3em 0.5em;
          background-color: #4a90e2;
          color: white;
          border-radius: 5px;
          font-size: 0.8em;
          margin-left: 0.5em;
          font-weight: bold;
          line-height: 1;
          display: inline-flex;
          align-items: center;

          svg {
            width: 12px;
            height: 12px;
            fill: currentColor;
            margin-left: -0.2em;
            margin-right: 0.2em;
            display: block;
          }
        }
      }
    }

    .change {
      display: flex;
      align-items: flex-end;
    }

    .close {
      background: none;
      border: none;
      cursor: pointer;
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 5px;
      background-color: rgb(255, 255, 255, 0.1);
      border-radius: 50%;

      svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
        display: block;
      }

      transition: background-color 0.1s ease-out;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .preferred-game {

    display: flex;
    justify-content: space-between;
    align-items: center;

    .switcher {
      display: flex;

      button {
        display: flex;
        gap: 0.5em;
        align-items: center;
        padding: 10px;
        border-radius: 0;
        border: none;
        width: 150px;

        .logo {
          height: 20px;
          display: block;
        }

        .logo-name {
          height: 15px;
          display: block;
        }

        &.mt {
          border-top-left-radius: 10px;
          border-bottom-left-radius: 10px;
          justify-content: right;
        }

        &.wot {
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;

          .logo-name {
            height: 17px;
          }
        }

        &.divider {
          width: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: bold;
        }

        &.active {
          background: #4a90e2;
        }

      }
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
          width: 34px;
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


          .arrow-right {
            width: 12px;
            height: 12px;
            fill: currentColor;
            display: block;
            margin-bottom: -1.5px;
          }

          .checkmark-shield {
            width: 15px;
            height: 15px;
            fill: currentColor;
            display: block;
          }

          &.green {
            background-color: rgb(18, 178, 69);
          }
        }

        .download {
          width: 18px;
          height: 18px;
          display: block;
          fill: currentColor;
          cursor: pointer;
          transition: filter 0.2s ease-out;
          padding: 5px;
          margin: -5px;
          margin-right: 8px;
          margin-left: -10px;

          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
          }
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
            display: flex;
            align-items: center;

            .checkbox {
              --accent-color: #34ff59;
              margin-left: -0.2em;
              margin-right: 0.4em;
              cursor: pointer;
            }

            .badges {
              display: inline-flex;
              align-items: center;
              gap: 0.5em;
              margin-left: auto;

              .badge {
                padding: 0.2em 0.5em;
                background-color: #4a90e2;
                color: white;
                border-radius: 5px;
                font-size: 0.8em;
                font-weight: bold;
                line-height: 1.2;

                &.green {
                  background-color: rgb(18, 178, 69);
                  color: white;
                }

                .checkmark-shield {
                  width: 15px;
                  height: 15px;
                  fill: currentColor;
                  display: block;
                }
              }

              .can-update {
                height: 8px;
                width: 8px;
                background-color: #4a90e2;
                border-radius: 20px;
              }
            }

            &:hover {
              background-color: rgba(255, 255, 255, 0.025);
            }

            &.selected {
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
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1em;

          p {
            flex: 1;
          }

          .download {
            width: 20px;
            height: 20px;
            float: right;
            fill: currentColor;
            cursor: pointer;
            transition: filter 0.2s ease-out;
            padding: 5px;
            margin: -5px 0;

            &:hover {
              background-color: rgba(255, 255, 255, 0.1);
              border-radius: 5px;
            }
          }

          .update-badge {
            padding: 0.2em 0.5em;
            background-color: #4a90e2;
            color: white;
            border-radius: 5px;
            font-size: 0.8em;
            font-weight: bold;
            line-height: 1.2;
            display: inline-flex;
            align-items: center;

            .arrow-right {
              width: 12px;
              height: 12px;
              fill: currentColor;
              display: block;
              margin: 0 0.2em;
              margin-bottom: -1.5px;
            }
          }

          .already-installed {
            // badge
            padding: 0.2em 0.5em;
            background-color: #2cb030;
            color: white;
            border-radius: 5px;
            font-size: 0.8em;
            font-weight: bold;
            line-height: 1.2;
            display: inline-flex;
            align-items: center;
          }
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
    display: flex;
    gap: 1em;

    .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.5em;

      h4 {
        margin: 0;
        line-height: 1;
      }

      p {
        line-height: 1.2;

        .badge {
          padding: 0.2em 0.5em;
          background-color: #4a90e2;
          color: white;
          border-radius: 5px;
          font-size: 0.8em;
          font-weight: bold;
          line-height: 1.2;
        }

        a {
          color: #ff741d;
          text-decoration: none;
          font-weight: bold;
          cursor: pointer;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .buttons {
      display: flex;
      gap: 1em;
      align-items: flex-end;
    }
  }
}

button {

  &.primary,
  &.secondary {
    color: white;
    position: relative;
    background: transparent;
    font-weight: bold;
    border: none;
    padding: 0.9em 1.2em;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    z-index: 3;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -2;
      border-radius: 8px;
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: 8px;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }
  }

  &.primary {

    &::before {
      background: linear-gradient(0deg, #ff3c00, #ff651d);
    }

    &::after {
      background: linear-gradient(0deg, #ff561d, #ff8c28);
    }

    &:hover {
      &::after {
        opacity: 1;
      }
    }

    &[disabled] {
      opacity: 0.5;
      cursor: not-allowed;

      &::after {
        opacity: 0.5;
      }
    }

  }

  &.secondary {
    padding: calc(0.9em - 2px) 1em;
    border: 2px solid #ff3c00;
    position: relative;

    &::before {
      background: #1a1a1a;
      border-radius: 6px;
      opacity: 1;
    }

    &::after {
      background: linear-gradient(0deg, #ff561d, #ff8c28);
      inset: -2px;
    }

    &:not([disabled]) {
      &:hover {
        &::after {
          opacity: 1;
        }
      }
    }

    &[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>