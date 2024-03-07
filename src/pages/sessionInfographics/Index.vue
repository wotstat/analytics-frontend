<template>
  <div class="center-container-new">
    <div class="sidebar">
      <div class="router-links">
        <RouterLink to="/session/battle">Бои</RouterLink>
        <RouterLink to="/session/shots">Стрельба</RouterLink>
        <RouterLink to="/session/damage">Урон</RouterLink>
        <RouterLink to="/session/results">Результаты</RouterLink>
        <RouterLink to="/session/maps">Карты</RouterLink>
        <RouterLink to="/session/players">Охват</RouterLink>
        <hr>
        <RouterLink to="/session/old-layout">Старый вид</RouterLink>
      </div>
    </div>

    <div class="container">
      <SettingsTitle :reload="true">
        Сессионная инфографика
      </SettingsTitle>
      <h3>
        <StatParamsTitle />
      </h3>

      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
      <!-- <h2>Бои</h2>
    <Battle />
    <h2>Стрельба</h2>
    <Shots />
    <h2 class="small-bottom-margin">Урон</h2>
    <p class="section-description">Распределения урона строятся для выстрелов с уроном, не фугасами и огненной смесью,
      по
      танкам с ХП больше максималки</p>
    <Damage />
    <h2>Результаты</h2>
    <Results />
    <h2>Карты</h2>
    <Maps />
    <h2>Охват</h2>
    <Coverage /> -->

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
      <p>Так же вы можете получить прямой доступ к базе данных и выполнять любые анатилические запросы на языке SQL</p>
      <br>
      <p>Связаться со мной вы можете по почте <a href="mailto:soprachev@mail.ru">soprachev@mail.ru</a></p>
    </div>


  </div>
</template>

<script setup lang="ts">
import Battle from "./Battle.vue";
import Shots from "./Shots.vue";
import Damage from "./Damage.vue";
import Results from "./Results.vue";
import Coverage from "./Coverage.vue";
import Maps from "./Maps.vue";
import Old from "./Old.vue";

import SettingsTitle from '@/components/SettingsTitle.vue';
import StatParamsTitle from "@/components/StatParamsTitle.vue";
import { useQueryStatParams } from "@/composition/useQueryStatParams";
import { totalRequests, totalElapsed, totalRowsRead } from "@/db";
import { countLocalize } from "@/utils/i18n";
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";

const stat = useQueryStatParams()

const targets = [
  ['/session/battle', 'Бои'],
  ['/session/shots', 'Стрельба'],
  ['/session/damage', 'Урон'],
  ['/session/results', 'Результаты'],
  ['/session/maps', 'Карты'],
  ['/session/players', 'Охват'],
  ['/session/old-layout', 'Старый вид'],
]

onBeforeRouteUpdate((to, from, next) => {

  if (targets.some(([path, title]) => path === to.path) && Object.keys(to.query).length == 0 && Object.keys(from.query).length > 0) {
    next({ ...to, query: from.query })
  } else {
    next()
  }
})
</script>

<style lang="scss" scoped>
@import "@/styles/mixins.scss";


.center-container-new {

  display: flex;
  justify-content: center;

  @media screen and (max-width: 1100px) {
    flex-direction: column;
  }

  .sidebar {
    min-width: 150px;
    margin: 1rem;
  }

  .container {
    margin: 1rem;
    flex: 1;

    @media screen and (min-width: 1500px) {
      max-width: calc(1200px - 3rem);
      margin-right: 150px;
    }
  }

  // @include medium {
  //   max-width: calc(1024px - 3rem);
  // }


}

.footer {
  margin-top: 200px;
  margin-bottom: 50px;
  border: 1px solid #353535;
}

.router-links {
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 100px;
  // gap: 2px;


  // @include less-medium {
  //   flex-direction: column;
  // }

  // @include large {
  //   flex-direction: column;
  //   position: absolute;

  //   top: 200px;
  //   left: 0;
  // }


  a {
    color: inherit;
    line-height: 1;
    padding: 8px;
    border-radius: 10px;

    &.router-link-exact-active {
      background-color: #353535;
    }

    &:hover {
      background-color: #353535;
    }
  }
}
</style>