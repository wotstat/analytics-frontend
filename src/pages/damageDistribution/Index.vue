<template>
  <div class="center-container">
    <SettingsTitle>
      Распределение урона
    </SettingsTitle>
    <h3>
      <StatParamsTitle />
    </h3>

    <p class="section-description">На графике отображаются выстрелы нанёсшие урон без добития, не явялющиеся фугасами или
      огненной смесью</p>
    <div class="card long">
      <GenericInfo :value="damageCount.count" description="Подходящих выстрелов" color="green" />
    </div>

    <p class="section-description">Для корректности графика, необходимо выбирать снаряды с одинаковым базовым уроном,
      число столбцов должно быть кратно разбросу урона.
      <br>
      На каждый столбик будет одинаковое число потенциальных исходов рандома.
      <br>
      Использование нескольких значений урона,
      приводит к всплескам на графике в местах округления до целых значений.
    </p>

    <div class="card long">
      <table>

      </table>
      <p class="card-main-info description">Виды снарядов по урону</p>
    </div>

  </div>
</template>


<script lang="ts" setup>

import SettingsTitle from '@/components/SettingsTitle.vue';
import StatParamsTitle from "@/components/StatParamsTitle.vue";
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import { useQueryStatParams, whereClause } from "@/composition/useQueryStatParams";
import { queryAsyncFirst } from '@/db';

const params = useQueryStatParams()

const damageCount = queryAsyncFirst(`
select count() as count
from Event_OnShot
    array join
     results.shotDamage as dmg,
     results.shotHealth as health
where dmg > 0
  and health > 0
  and shellTag != 'HIGH_EXPLOSIVE'
  and shellTag != 'FLAME'
  ${whereClause(params, { withWhere: false })};
`, { count: 0 })

</script>

<style lang="scss"></style>