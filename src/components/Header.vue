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


        <!-- <div class="sep"></div> -->

        <!-- <div class="i18n drop-down">
          <I18nIcon class="icon" />
          <ArrowDownIcon class="icon arrow" />

          <div class="menu">
            <a href="/">Русский</a>
            <a href="/en">English</a>
            <a href="/en">English</a>
            <a href="/en">English</a>
            <a href="/en">English</a>
            <a href="/en">English</a>
          </div>
        </div> -->


        <div class="sep"></div>

        <a href="https://boosty.to/wotstat" target="_blank" class="icon">
          <BoostyIcon class="icon" />
        </a>

        <a href="https://patreon.com/wotstat" target="_blank" class="icon">
          <PatreonIcon class="icon" />
        </a>

        <div class="sep"></div>
        <a :href="discordUrl" target="_blank" class="icon">
          <DiscordIcon class="icon" />
        </a>

        <a href="https://github.com/WOT-STAT/WOTMOD" target="_blank" class="icon">
          <GitHubIcon class="icon" />
        </a>

      </div>
    </div>
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

.background {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(78, 144, 201);
}

.drop-down {
  .menu {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: $background-secondary;
    border-radius: 5px;
    box-shadow: 0px 0px 10px 2px $background-color;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 5px 0;
    z-index: 10000;
  }

  &:hover {
    .menu {
      display: flex;
    }
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

.header {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  background-color: $background-secondary;
  padding: 0 14px 0 18px;
  z-index: 10;
  display: flex;
  align-items: center;
  flex-direction: column;

  box-shadow: 0px 0px 10px 2px $background-color;

  @include less-small {
    padding: 0 10px;
  }


  .sep {
    width: 0px;
    height: 25px;
    margin: 0 8px;
    border-right: 1px solid #5d5d5dbc;
  }

  .spacer {
    transition: all 0.1s;
  }

  .main {
    align-items: center;
    width: 100%;
    height: 55px;
    gap: 0;

    .header-right {
      align-items: center;
      gap: 0;
    }

    .wotstat-logo {
      font-size: 25px;
      font-weight: bold;

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


    a.icon {
      font-size: 0;
      color: inherit;
      padding: 5px 8px;

      .icon {
        width: 20px;
        height: 20px;
        cursor: pointer;
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
  }
}
</style>