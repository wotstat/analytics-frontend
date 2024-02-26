<template>
  <div class="center-container">
    <SettingsTitle>
      Сессионная инфографика
    </SettingsTitle>
    <h3>
      <StatParamsTitle />
    </h3>
    <h2>Бои</h2>
    <Battle />
    <h2>Стрельба</h2>
    <Shots />
    <h2 class="small-bottom-margin">Урон</h2>
    <p class="section-description">Распределения урона строятся для выстрелов с уроном, не фугасами и огненной смесью, по
      танкам с ХП больше максималки</p>
    <Damage />
    <h2>Результаты</h2>
    <Results />
    <h2>Карты</h2>
    <Maps />
    <h2>Охват</h2>
    <Coverage />

    <hr class="footer">

    <h2>Спасибо за использование</h2>
    <p>Вы совершили <b>{{ totalRequests }} </b> {{ countLocalize(totalRequests, 'запрос', 'запроса', 'запросов') }} к базе
      данных,
      которые выполнялись <b>{{ Math.round(totalElapsed) }}</b>
      {{ countLocalize(Math.round(totalElapsed), 'секунду', 'секунды', 'секунд') }}. Запросы взаимодействовали суммарно с
      <b>{{ new Number(totalRowsRead).toLocaleString() }}</b> строк базы данных.
    </p>
    <br>
    <p>Если вы хотите больше графиков, можете написать мне</p>
    <p>Так же вы можете получить прямой доступ к базе данных и выполнять любые анатилические запросы на языке SQL</p>
    <br>
    <p>Связаться со мной вы можете по почте <a href="mailto:soprachev@mail.ru">soprachev@mail.ru</a></p>

  </div>
</template>

<script setup lang="ts">
import Battle from "./Battle.vue";
import Shots from "./Shots.vue";
import Damage from "./Damage.vue";
import Results from "./Results.vue";
import Coverage from "./Coverage.vue";
import Maps from "./Maps.vue";

import SettingsTitle from '@/components/SettingsTitle.vue';
import StatParamsTitle from "@/components/StatParamsTitle.vue";
import { useQueryStatParams } from "@/composition/useQueryStatParams";
import { totalRequests, totalElapsed, totalRowsRead } from "@/db";
import { countLocalize } from "@/utils/i18n";

const stat = useQueryStatParams() 
</script>

<style lang="scss" scoped>
.footer {
  margin-top: 200px;
  margin-bottom: 50px;
  border: 1px solid #353535;
}
</style>