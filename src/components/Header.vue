<template>
  <div class="header">
    <div class="main flex">
      <router-link to="/" class="wotstat-logo">WotStat</router-link>
      <router-link to="/" class="wotstat-logo small">WS</router-link>
      <div class="flex-1"></div>
      <div class="header-right flex">
        <router-link to="/">Главная</router-link>
        <router-link to="/session"
          :class="startsWith('/session') ? 'router-link-exact-active' : ''">Инфографика</router-link>
        <a :href="DBUrl + '/play?user=public#c2VsZWN0IHRhYmxlLCBuYW1lLCBjb21tZW50LCB0eXBlIGZyb20gZGVzY3JpcHRpb247'"
          target="_blank" rel="noopener noreferrer">SQL</a>


        <div class="wide">
          <!-- <div class="sep"></div>

          <div class="i18n drop-down">
            <I18nIcon class="icon" />
            <ArrowDownIcon class="icon arrow" />

            <div class="menu">
              <a href="/">Русский</a>
              <a href="/en">English</a>
              <a href="/en">Spenish</a>
            </div>
          </div> -->


          <div class="sep"></div>

          <a href="https://boosty.to/wotstat" target="_blank" class="icon">
            <BoostyIcon />
          </a>

          <a href="https://patreon.com/wotstat" target="_blank" class="icon">
            <PatreonIcon />
          </a>

          <div class="sep"></div>
          <a :href="discordUrl" target="_blank" class="icon">
            <DiscordIcon />
          </a>

          <a href="https://github.com/WOT-STAT/WOTMOD" target="_blank" class="icon">
            <GitHubIcon />
          </a>
        </div>

        <div class="drop-down points-menu">
          <PointsIcon class="icon" />
          <div class="menu">
            <!-- <a href="/points">Русский</a>
            <a href="/points/players">English</a>
            <hr> -->
            <div class="flex">
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

      </div>
    </div>
  </div>
  <div class="header-background">
    <div class="spacer-1"></div>
    <div class="spacer" :style="{
      height: additionalHeaderHeight + 'px'
    }"></div>
  </div>
</template>

<script setup lang="ts">
import { useAdditionalHeaderHeight } from '@/composition/useAdditionalHeaderHeight';
import { useRoute } from 'vue-router';
import GitHubIcon from '@/assets/icons/github.svg'
import DiscordIcon from '@/assets/icons/discord.svg'
import PatreonIcon from '@/assets/icons/patreon.svg'
import BoostyIcon from '@/assets/icons/boosty.svg'
import I18nIcon from '@/assets/icons/i18n.svg'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg'
import PointsIcon from '@/assets/icons/points.svg'

const DBUrl = import.meta.env.VITE_CLICKHOUSE_URL
const discordUrl = import.meta.env.VITE_DISCORD_URL
const route = useRoute()

function startsWith(path: string) {
  return route.path.startsWith(path);
}

const { additionalHeaderHeight } = useAdditionalHeaderHeight();

</script>

<style scoped lang="scss">
@import '@/styles/textColors.scss';
@import '@/styles/mixins.scss';

.header-background {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  z-index: 10;

  background-color: $background-secondary;
  box-shadow: 0px 0px 10px 2px $background-color;

  .spacer-1 {
    height: 55px;
  }

  .spacer {
    transition: all 0.1s;
  }
}

.header {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  padding: 0 14px 0 18px;
  z-index: 11;
  display: flex;
  align-items: center;
  flex-direction: column;


  @include less-small {
    padding: 0 10px;
  }


  .sep {
    width: 0px;
    height: 25px;
    margin: 0 8px;
    border-right: 1px solid #5d5d5dbc;
  }

  .main {
    align-items: center;
    width: 100%;
    height: 55px;
    gap: 0;

    a.icon {
      font-size: 0;
      color: inherit;
      padding: 5px 8px;

      :deep(svg) {
        fill: currentColor;
        width: 20px;
        height: 20px;
      }
    }

    a {
      color: inherit;
      padding: 0 10px;
      transition: all 0.2s;

      &.router-link-exact-active {
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

      &.router-link-exact-active {
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

    .wide {
      display: flex;
      align-items: center;
      gap: 0;

      @include less-small {
        display: none;
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
      padding: 15px 5px;
      padding-right: 0;

      @include small {
        display: none;
      }

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
        top: calc(100% - 5px);
        right: 0;
        padding: 10px;
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

        a {
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
      }

      &:hover {
        .menu {
          visibility: visible;
          opacity: 1;
        }
      }
    }

    // .icon {
    //   width: 20px;
    //   height: 20px;
    //   fill: currentColor;
    // }
  }
}
</style>