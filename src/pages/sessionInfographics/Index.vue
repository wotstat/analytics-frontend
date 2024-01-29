<template>
  <div class="center-container">
    <h1>Сессионная инфографика</h1>
    <h2>Бои</h2>
    <Battle />
    <h2>Стрельба</h2>
    <Shots />
    <h2>Урон</h2>
    <Damage />
    <h2>Результаты</h2>
    <Results />
    <h2>Карты</h2>
    <Maps />
    <h2>Охват</h2>
    <Coverage />

    <hr class="footer">

    <h2>Спасибо за использование</h2>
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

</script>

<style lang="scss" scoped> .footer {
   margin-top: 200px;
   margin-bottom: 50px;
   border: 1px solid #353535;
 }
</style>

<style lang="scss">
@import '@/styles/mixins.scss';

.card {
  padding: 15px;
}

.hor-ver-x-small {
  @include less-x-small {
    flex-direction: column;
  }
}

.hor-ver-small {
  @include less-small {
    flex-direction: column;
  }
}
</style>