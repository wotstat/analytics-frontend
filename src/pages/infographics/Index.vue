<template>

  <SidebarLayout :links>
    <template #content-top>
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
    </template>

    <template #default>
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
    </template>

  </SidebarLayout>
</template>

<script setup lang="ts">

import SettingsTitle from '@/pages/infographics/settings/SettingsTitle.vue'
import StatParamsTitle from '@/pages/infographics/settings/StatParamsTitle.vue'
import { useQueryStatParams } from '@/composition/useQueryStatParams'
import { totalRequests, totalElapsed, totalRowsRead } from '@/db'
import { countLocalize } from '@/utils/i18n'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import TankListSetup from '@/components/tankListSetup/Index.vue'

import SidebarLayout from '@/components/sidebarLayout/Index.vue'
import { SidebarLink } from '@/components/sidebarLayout/utils'

const links: SidebarLink[] = [
  { to: '/session', labels: 'Бои' },
  { to: '/session/shots', labels: 'Стрельба' },
  { to: '/session/damage', labels: 'Урон' },
  { to: '/session/results', labels: 'Результаты' },
  { to: '/session/maps', labels: 'Карты' },
  { to: '/session/players', labels: 'Охват' },
  'separator',
  // { to: '/session/distribution', labels: 'Расширенное распределение', shortLabel: 'Распределение' },
  { to: '/session/lootbox', labels: 'Коробки' },
  { to: '/session/chuck-norris-tournament', labels: 'Очки Чака' },
  'separator',
  { to: '/widgets', labels: 'Виджеты' },
]

const route = useRoute()

const key = ref(0)

const stat = useQueryStatParams()
watch(stat, (current, old) => {
  if (JSON.stringify(current) == JSON.stringify(old)) return
  key.value++
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

.footer {
  margin-top: 200px;
  margin-bottom: 50px;
  border: 1px solid #353535;
}
</style>