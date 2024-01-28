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
    <h2>Охват</h2>
    <Coverage />

  </div>
</template>

<script setup lang="ts">
import Battle from "./Battle.vue";
import Shots from "./Shots.vue";
import Damage from "./Damage.vue";
import Results from "./Results.vue";
import Coverage from "./Coverage.vue";

</script>

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