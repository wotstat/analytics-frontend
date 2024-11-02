<template>

  <div class="center-container-new">
    <div class="sidebar">
      <div class="router-links">
        <QueryPreserveRouterLink to="/session">Бои</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/session/shots">Стрельба</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/session/damage">Урон</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/session/results">Результаты</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/session/maps">Карты</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/session/players">Охват</QueryPreserveRouterLink>

        <hr>

        <QueryPreserveRouterLink to="/session/distribution">Расширенное распределение</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/session/lootbox">Коробки</QueryPreserveRouterLink>
        <QueryPreserveRouterLink to="/session/chuck-norris-tournament">Очки Чака</QueryPreserveRouterLink>
        <hr>
        <QueryPreserveRouterLink to="/session/widgets">Виджеты</QueryPreserveRouterLink>
      </div>
    </div>

    <div class="container">
      <template v-if="!route.meta.customTitle">
        <SettingsTitle :reload="false">
          Сессионная инфографика
        </SettingsTitle>
        <h3>
          <StatParamsTitle />
        </h3>
      </template>
      <h1 class="main-title" v-if="route.meta.customTitle">{{ route.meta.customTitle }}</h1>

      <TankListSetup v-if="!route.meta.hideTankList" />

      <div class="menu-bar" ref="menuBar" :class="menuTop <= headerOffset && menuY != 0 ? 'top' : ''">
        <div class="router-links">
          <QueryPreserveRouterLink to="/session">Бои</QueryPreserveRouterLink>
          <QueryPreserveRouterLink to="/session/shots">Стрельба</QueryPreserveRouterLink>
          <QueryPreserveRouterLink to="/session/damage">Урон</QueryPreserveRouterLink>
          <QueryPreserveRouterLink to="/session/results">Результаты</QueryPreserveRouterLink>
          <QueryPreserveRouterLink to="/session/maps">Карты</QueryPreserveRouterLink>
          <QueryPreserveRouterLink to="/session/players">Охват</QueryPreserveRouterLink>

          <QueryPreserveRouterLink to="/session/distribution">Распределение</QueryPreserveRouterLink>
          <QueryPreserveRouterLink to="/session/lootbox">Коробки</QueryPreserveRouterLink>
          <QueryPreserveRouterLink to="/session/chuck-norris-tournament">Очки Чака</QueryPreserveRouterLink>
          <QueryPreserveRouterLink to="/session/widgets">Виджеты</QueryPreserveRouterLink>
        </div>
      </div>

      <RouterView v-slot="{ Component }" :key="key">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>

      <hr class="footer">

      <h2>Спасибо за использование</h2>
      <p>Вы совершили <b>{{ totalRequests }} </b> {{ countLocalize(totalRequests, 'запрос', 'запроса', 'запросов') }} к
        базе данных, которые выполнялись <b>{{ Math.round(totalElapsed) }}</b>
        {{ countLocalize(Math.round(totalElapsed), 'секунду', 'секунды', 'секунд') }}. Запросы взаимодействовали
        суммарно
        с
        <b>{{ new Number(totalRowsRead).toLocaleString() }}</b> строк базы данных.
      </p>
      <br>
      <p>Если вы хотите больше графиков, можете написать мне</p>
      <p>Так же вы можете получить прямой доступ к базе данных и выполнять любые аналитические запросы на языке SQL</p>
      <br>
      <p>Финансово поддержать разработку вы можете на
        <a href='https://boosty.to/wotstat' target="_blank">boosty.to/wotstat</a>
        или
        <a href='https://patreon.com/WotStat' target="_blank">patreon.com/wotstat</a>
      </p>
      <br>
      <p>Связаться со мной вы можете по почте <a href="mailto:support@wotstat.info">support@wotstat.info</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">

import QueryPreserveRouterLink from '@/components/QueryPreserveRouterLink.vue';
import SettingsTitle from '@/components/SettingsTitle.vue';
import StatParamsTitle from "@/components/StatParamsTitle.vue";
import { headerHeight, useAdditionalHeaderHeight } from '@/composition/useAdditionalHeaderHeight';
import { useQueryStatParams } from "@/composition/useQueryStatParams";
import { totalRequests, totalElapsed, totalRowsRead } from "@/db";
import { countLocalize } from "@/utils/i18n";
import { useElementBounding } from '@vueuse/core';
import { computed, ref, watch, watchEffect } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import TankListSetup from "@/components/TankListSetup/Index.vue";

const menuBar = ref<HTMLElement | null>(null);
const { top: menuTop, y: menuY, height: menuH } = useElementBounding(menuBar)

const key = ref(0)

const stat = useQueryStatParams()
const route = useRoute()
const headerOffset = computed(() => headerHeight.value)

watch(stat, (current, old) => {
  if (JSON.stringify(current) == JSON.stringify(old)) return;
  key.value++;
})

const { additionalHeaderHeight } = useAdditionalHeaderHeight();

watchEffect(() => {
  if (menuY.value == 0) return additionalHeaderHeight.value = 0;
  if (menuTop.value > headerOffset.value) return additionalHeaderHeight.value = 0;
  additionalHeaderHeight.value = menuH.value - 18
})

</script>

<style lang="scss" scoped>
@use '/src/styles/textColors.scss';
@use "/src/styles/mixins.scss" as *;
@use '/src/styles/variables.scss' as *;

$sidebar-width: 170px;
$mobile-layout: 1100px;


.main-title {
  margin: 0;

  @include less-x-small {
    font-size: 1.8rem;
  }
}

.center-container-new {

  display: flex;
  justify-content: center;

  @media screen and (max-width: $mobile-layout) {
    flex-direction: column;
  }

  .sidebar {
    width: $sidebar-width;
    margin: 1rem;

    @media screen and (max-width: $mobile-layout) {
      display: none;
    }

    .router-links {
      display: flex;
      flex-direction: column;
      position: sticky;
      top: calc(var(--header-height) + 40px);
    }
  }

  .menu-bar {
    margin: 20px -1rem;
    padding: 5px 1rem;
    position: sticky;
    top: calc(var(--header-height) - 15px);
    z-index: 10;

    @media screen and (min-width: calc($mobile-layout + 1px)) {
      display: none;
    }

    .router-links {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }

    .router-links>a:hover:not(.router-link-exact-active) {
      background-color: unset;
    }

    &.top {
      .router-links {
        a {
          &.router-link-exact-active {
            color: #d6fbff;
            filter: drop-shadow(0 0 0.5em #4a7697bc);
            background-color: unset;
          }
        }
      }
    }

  }

  .container {
    margin: 1rem;
    flex: 1;
    min-width: 0;

    @media screen and (min-width: 1500px) {
      max-width: calc(1200px - 3rem);
      margin-right: $sidebar-width;
    }

    @media screen and (max-width: $mobile-layout) {
      :deep(.page-title) {
        display: none;
      }
    }
  }
}

.footer {
  margin-top: 200px;
  margin-bottom: 50px;
  border: 1px solid #353535;
}

.router-links {
  a {
    color: inherit;
    line-height: 1.2;
    padding: 6.5px 8px;
    border-radius: 10px;
    cursor: pointer;

    &.router-link-exact-active {
      background-color: #353535;
    }

    &:hover {
      background-color: #353535;
    }
  }
}
</style>