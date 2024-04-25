<template>
  <div class="header">
    <div class="main flex">
      <router-link to="/" class="logo">WotStat</router-link>
      <router-link to="/" class="logo small">WS</router-link>
      <div class="flex-1"></div>
      <div class="header-right flex">
        <router-link to="/">Главная</router-link>
        <router-link to="/session"
          :class="startsWith('/session') ? 'router-link-exact-active' : ''">Инфографика</router-link>
        <a class="boosty" href='https://boosty.to/wotstat' target="_blank" rel="noopener noreferrer">Спонсорство</a>
        <a :href="DBUrl + '/play?user=public#c2VsZWN0IHRhYmxlLCBuYW1lLCBjb21tZW50LCB0eXBlIGZyb20gZGVzY3JpcHRpb247'"
          target="_blank" rel="noopener noreferrer">БД</a>
        <svg @click="openGithub" height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" fill="#fff"
          class="icon-github">
          <path
            d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z">
          </path>
        </svg>
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

// import { RouterLink } from 'vue-router';
const DBUrl = import.meta.env.VITE_CLICKHOUSE_URL
const route = useRoute()

function openGithub() {
  window.open('https://github.com/WOT-STAT/WOTMOD', '_blank');
}

function startsWith(path: string) {
  return route.path.startsWith(path);
}

const { additionalHeaderHeight } = useAdditionalHeaderHeight();

</script>

<style scoped lang="scss">
@import '@/styles/textColors.scss';
@import '@/styles/mixins.scss';

/* Style the header with a grey background and some padding */
.header {
  overflow: hidden;
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  background-color: $background-secondary;
  padding: 10px 14px 10px 18px;
  z-index: 10;

  box-shadow: 0px 0px 10px 2px $background-color;

  .spacer {
    transition: all 0.1s;
  }


  .main {
    align-items: center;

    @include less-x-small {
      gap: 0;

      .header-right {
        gap: 0;
      }
    }

    .logo {
      font-size: 25px;
      font-weight: bold;
      color: inherit;

      @include less-x-small {
        display: none;
      }

      &.small {
        display: none;

        @include less-x-small {
          display: block;
        }
      }
    }

    .icon-github {
      width: 24px;
      height: 24px;
      cursor: pointer;

      @include less-x-small {
        display: none;
      }
    }

    a:not(.logo) {
      color: inherit;
      padding: 0 10px;

      &.router-link-exact-active {
        color: #d6fbff;
        filter: drop-shadow(0 0 0.5em #4a7697bc);
      }
    }

    .boosty {
      @include less-small {
        display: none;
      }
    }
  }
}
</style>