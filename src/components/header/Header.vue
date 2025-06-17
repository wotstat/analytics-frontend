<template>
  <div class="header" ref="headerElement">
    <!-- <div class="upper-header success">
      Работа WotStat восстановлена. Некоторые аналитические данные будут доступны позже в течение дня.
    </div> -->

    <div class="upper-header blue" v-if="CURRENT_URL_PREFIX != 'ru.' && ruHeaderVisible">
      Доступен резервный домен на случай замедлений в России <a href="http://ru.wotstat.info"
        target="_blank">ru.wotstat.info</a>

      <div class="right-section">
        <button @click="hideHeader('RuAlternativeHeader')">Понятно</button>
      </div>
    </div>

    <div class="main flex">
      <router-link to="/" class="wotstat-logo">WotStat</router-link>
      <router-link to="/" class="wotstat-logo small">WS</router-link>
      <div class="positions-section flex">
        <div class="sep"></div>
        <a :href="POSITIONS_URL" target="_blank" rel="noopener noreferrer" class="positions">
          <div class="back">
            Мод на позиции
            <LogoIcon class="logo-icon" />
          </div>
        </a>
      </div>
      <div class="flex-1"></div>
      <div class="header-right flex">
        <router-link to="/" class="hero">Главная</router-link>
        <router-link to="/session" class="infographics">Инфографика</router-link>
        <router-link to="/widgets" class="widgets">Виджеты</router-link>
        <router-link to="/bb25" class="replays bob25">ББ2025</router-link>
        <!-- <router-link to="/replays" class="replays">Реплеи</router-link> -->

        <div class="drop-down points-menu">
          <PointsIcon class="icon" />
          <div class="menu">

            <router-link to="/" class="hero">Главная</router-link>
            <router-link to="/session" class="infographics">Инфографика</router-link>
            <router-link to="/widgets" class="widgets">Виджеты</router-link>
            <router-link to="/bb25" class="replays">ББ2025</router-link>
            <!-- <router-link to="/replays" class="replays">Реплеи</router-link> -->
            <a :href="SQLUrl" target="_blank" rel="noopener noreferrer" class="sql">Доступ к БД </a>
            <hr class="any-page-divider">

            <div class="language-section container">
              <a href="/">Русский</a>
              <a href="/en">English</a>
              <hr>
            </div>

            <div class="positions-section">
              <div class="flex btn">
                <a :href="POSITIONS_URL" target="_blank" rel="noopener noreferrer" class="positions flex-1">
                  <div class="back">
                    Мод на позиции
                    <LogoIcon class="logo-icon" />
                  </div>
                </a>
              </div>
              <hr>
            </div>

            <div class="line flex links-sections">
              <a href="https://boosty.to/wotstat" target="_blank" class="icon">
                <BoostyIcon />
                Boosty
              </a>
              <a href="https://patreon.com/wotstat" target="_blank" class="icon">
                <PatreonIcon />
              </a>
              <a :href="discordUrl" target="_blank" class="icon">
                <DiscordIcon />
              </a>
              <a href="https://github.com/WOT-STAT/WOTMOD" target="_blank" class="icon">
                <GitHubIcon />
              </a>
            </div>
          </div>
        </div>

        <div class="language-section flex">
          <div class="sep"></div>

          <div class="i18n drop-down">
            <I18nIcon class="icon" />
            <ArrowDownIcon class="icon arrow" />

            <div class="menu">
              <a href="/">Русский</a>
              <a href="/en">English</a>
              <a href="/en">Spenish</a>
            </div>
          </div>
        </div>

        <div class="links-sections flex">

          <div class="sep"></div>

          <a href="https://boosty.to/wotstat" target="_blank" class="icon">
            <BoostyIcon />
          </a>

          <a href="https://patreon.com/wotstat" target="_blank" class="icon">
            <PatreonIcon />
          </a>

          <a :href="discordUrl" target="_blank" class="icon">
            <DiscordIcon />
          </a>

          <div class="sep"></div>

          <a :href="SQLUrl" target="_blank" class="icon">
            <DatabaseIcon />
          </a>

          <a href="https://github.com/WOT-STAT/WOTMOD" target="_blank" class="icon">
            <GitHubIcon />
          </a>

        </div>

      </div>
    </div>
  </div>
  <div class="header-background">
    <HeaderSpacer />
    <div class="spacer" :style="{
      height: additionalHeaderHeight + 'px'
    }"></div>
  </div>
</template>

<script setup lang="ts">
import { useAdditionalHeaderHeight, useDefaultHeaderHeight } from '@/composition/useAdditionalHeaderHeight';
import { ref } from 'vue';
import GitHubIcon from './assets/github.svg'
import DiscordIcon from './assets/discord.svg'
import PatreonIcon from './assets/patreon.svg'
import BoostyIcon from './assets/boosty.svg'
import DatabaseIcon from './assets/database.svg'
import PointsIcon from './assets/points.svg'
import LogoIcon from './assets/logo2.0.svg'
import HeaderSpacer from './HeaderSpacer.vue';
import I18nIcon from './assets/i18n.svg'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg'
import { CLICKHOUSE_URL, CURRENT_URL_PREFIX, POSITIONS_URL } from '@/utils/externalUrl';
import { useLocalStorage } from '@vueuse/core';

const discordUrl = import.meta.env.VITE_DISCORD_URL

const SQLUrl = CLICKHOUSE_URL + '/play?user=public#c2VsZWN0IHRhYmxlLCBuYW1lLCBjb21tZW50LCB0eXBlIGZyb20gZGVzY3JpcHRpb247'

const headerElement = ref<HTMLElement | null>(null);
useDefaultHeaderHeight(headerElement);

const { additionalHeaderHeight } = useAdditionalHeaderHeight();

const ruHeaderVisible = useLocalStorage('RuAlternativeHeader', true);

function hideHeader(name: string) {
  if (name == 'RuAlternativeHeader') ruHeaderVisible.value = false;
}

</script>

<style scoped lang="scss">
@use '/src/styles/textColors.scss';
@use '/src/styles/mixins.scss' as *;
@use '/src/styles/variables.scss' as *;

.header-background {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  z-index: 10;

  background-color: $background-secondary;
  box-shadow: 0px 0px 10px 2px $background-color;

  .spacer {
    transition: all 0.1s;
  }
}

.header {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  z-index: 11;
  display: flex;
  align-items: center;
  flex-direction: column;

  .upper-header {
    width: 100%;
    color: white;
    padding: 1em;
    text-align: center;
    box-sizing: border-box;
    font-size: 14px;
    font-weight: var(--bold-weight);
    position: relative;

    &.warning {
      background-color: #c4800b86;
    }

    &.success {
      background-color: #0bc45786;
    }

    &.blue {
      background-color: #1280d6;

      a {
        color: rgb(193, 255, 186);
      }
    }

    a {
      font-weight: var(--bold-weight);
    }

    .right-section {
      position: absolute;
      right: 10px;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: center;
    }

    &:has(.right-section) {
      padding: 1em 110px;

      @media screen and (max-width: 650px) {
        padding: 1em;
        padding-right: 110px;
      }

      @media screen and (max-width: 400px) {
        padding: 1em;

        .right-section {
          position: static;
          width: 100%;
          text-align: center;
          margin-top: 10px;

          * {
            flex: 1;
          }
        }
      }
    }
  }

  .flex {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .sep {
    width: 0px;
    height: 25px;
    margin: 0 8px;
    border-right: 1px solid #5d5d5dbc;
  }

  .main {
    box-sizing: border-box;
    align-items: center;
    width: 100%;
    height: 55px;
    padding: 0 14px 0 18px;
    gap: 0;

    @include less-small {
      padding: 0 10px;
    }

    a.icon {
      font-size: 0;
      color: inherit;
      padding: 15px 8px;

      :deep(svg) {
        fill: currentColor;
        width: 20px;
        height: 20px;
      }
    }

    a {
      color: inherit;
      padding: 15px 10px;
      transition: all 0.2s;

      &.router-link-active {
        color: #d6fbff;
        filter: drop-shadow(0 0 0.5em #4a7697bc);
      }

      &:hover {
        color: #f5fdffde;
        filter: drop-shadow(0 0 0.3em #3fa5f362);
      }
    }

    .header-right {
      align-items: center;
      gap: 0;
    }

    .wotstat-logo {
      font-size: 25px;
      font-weight: bold;

      &.router-link-active {
        color: inherit;
        filter: none
      }

      &.small {
        display: none;
      }

      @include less-small {
        display: none;

        &.small {
          display: block;
        }

      }
    }

    .positions {
      font-size: 14px;
      font-weight: var(--bold-weight);
      color: rgba(255, 255, 255, 0.9);
      padding: 1.5px;
      transition: all 0.2s;
      background: linear-gradient(13deg, #2ef45f 0%, #2f80ed 100%);
      border-radius: 10px;
      margin: 0 10px;
      position: relative;
      text-wrap: nowrap;

      &.new-badge {
        &::before {
          position: absolute;
          content: 'NEW';
          top: -5px;
          right: -5px;
          background-color: #2f80ed;
          border-radius: 5px;
          padding: 0px 3px;
          font-size: 10px;
        }
      }

      .back {
        padding: 4px 10px;
        border-radius: 8.5px;
        transition: all 0.2s;
        background-color: $background-secondary;

        .logo-icon {
          height: 1.1em;
          display: inline-block;
          margin-bottom: -0.25em;
        }
      }

      &:hover {
        padding: 3px;

        .back {
          padding: 2.5px 8.5px;
          border-radius: 7px;
          color: white;
        }

        filter: drop-shadow(0 0 0.3em #2f81ed99);
      }
    }

    .i18n {
      position: relative;
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 15px 5px;

      .icon {
        width: 16px;
        height: 16px;
      }

      .arrow {
        width: 10px;
        height: 10px;
        margin-left: 3px;
      }
    }

    .points-menu {
      color: inherit;
      display: flex;
      align-items: center;
      padding: 15px 17px 15px 17px;
      margin-right: -10px;
      margin-left: -7px;
      z-index: 2;

      hr {
        margin: 5px 0;
        border: none;
        border-top: 1px solid #5d5d5dbc;
      }

      .flex {
        gap: 3px;
      }

      .icon {
        width: 20px;
        height: 20px;
      }
    }

    .drop-down {
      .menu {
        position: absolute;
        top: calc(100% - 12px);
        right: 5px;
        padding: 6px;
        z-index: 1000;

        display: flex;
        flex-direction: column;
        gap: 0;

        border-radius: 15px;
        background-color: $background-secondary;
        box-shadow: 0px 0px 10px 0px $background-color;
        border: 1px solid #5d5d5dbc;

        visibility: hidden;
        opacity: 0;
        transition: opacity 0.2s;

        >a,
        >.line>a,
        >.container>a {
          padding: 5px 10px;
          border-radius: 10px;
          transition: all 0.2s;
          padding: 5px 10px;
          filter: none;

          &:hover {
            background-color: #5d5d5dbc;
            filter: none;
          }
        }

        .btn {
          padding: 5px 0;
        }

        .positions {
          margin: 0;
          text-align: center;
        }
      }

      &:hover {
        .menu {
          visibility: visible;
          opacity: 1;
        }
      }
    }
  }
}

$drop-down-menu: 1050px;
$links-sections: 1050px;
$sql: 1050px;
$replays: 830px;
$widgets: 500px;
$infographics: 400px;
$positions: 680px;
$hero: 100px;
$language-section: 300px;

@mixin hide-if-small($width, $class) {
  @media (max-width: $width) {
    &.#{$class} {
      display: none;
    }
  }
}

@mixin hide-if-greater($width, $class) {
  @media (min-width: calc($width + 1px)) {
    &.#{$class} {
      display: none;
    }
  }
}

.header .main {
  *:not(:is(.menu *)) {
    @include hide-if-greater($drop-down-menu, points-menu);
    @include hide-if-small($links-sections, links-sections);
    @include hide-if-small($sql, sql);
    @include hide-if-small($replays, replays);
    @include hide-if-small($widgets, widgets);
    @include hide-if-small($infographics, infographics);
    @include hide-if-small($hero, hero);
    @include hide-if-small($positions, positions-section);
    @include hide-if-small($language-section, language-section);
  }
}


.header .main .menu {

  .language-section {
    display: flex;
    flex-direction: column;
  }

  * {
    @include hide-if-greater($links-sections, links-sections);
    @include hide-if-greater($sql, any-page-divider);
    @include hide-if-greater($sql, sql);
    @include hide-if-greater($replays, replays);
    @include hide-if-greater($widgets, widgets);
    @include hide-if-greater($infographics, infographics);
    @include hide-if-greater($hero, hero);
    @include hide-if-greater($positions, positions-section);
    @include hide-if-greater($language-section, language-section);
  }
}

.language-section {
  display: none !important;
}

.main a.bob25 {
  font-weight: bold;
  color: white !important;

  text-shadow:
    0.5px 0.3px 4px rgba(0, 195, 255, 0.3),
    -0.5px -0.5px 4px rgba(225, 0, 255, 0.3),
    0.5px 0.5px 1.2px rgb(0, 195, 255, 0.6),
    -0.5px -0.3px 1.2px rgb(225, 0, 255, 0.6);

  filter: drop-shadow(0 0 0.5em #0000003e);
}
</style>