<template>
  <DebugSection title="Четыре селектора и с чего начать" id="overview"
    description="Все четыре собраны из одних и тех же кусков: строка бейджей + поповер (у карт — модалка) + список с поиском. Если что-то сломалось, сначала посмотри, на каком уровне: бейджи, обёртка с поповером или сам список.">

    <table class="debug-table">
      <thead>
        <tr>
          <th>селектор</th>
          <th>обёртка</th>
          <th>чем открывается</th>
          <th>что в модели</th>
          <th>секция</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>Техника</th>
          <td>VehicleSelectorBadges → BadgesLinePopover</td>
          <td>поповер</td>
          <td>Set&lt;тег танка&gt;</td>
          <td><a href="#vehicle">техника</a></td>
        </tr>
        <tr>
          <th>Карты</th>
          <td>ArenaSelectorBadges → BadgesLine + ModalWindow</td>
          <td>модалка</td>
          <td>Set&lt;тег:команда&gt;</td>
          <td><a href="#arena">карты</a></td>
        </tr>
        <tr>
          <th>Игра</th>
          <td>GameSelector, три кнопки без поповера</td>
          <td>—</td>
          <td>'mt' | 'wot' | 'any'</td>
          <td><a href="#game">игра</a></td>
        </tr>
        <tr>
          <th>Версия</th>
          <td>GameVersionSelectorBadges → BadgesLinePopover</td>
          <td>поповер</td>
          <td>Set&lt;{ version, region? }&gt;</td>
          <td><a href="#version">версия</a></td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Состояние выбора на этой странице — обычные локальные <span class="debug-value">ref</span>. В бою (единственное
      живое применение — <span class="debug-value">src/pages/replays/search/Index.vue</span>) оно тоже локальное, а
      фильтры статистики держат своё состояние в URL-query через
      <span class="debug-value">useQueryStatParams</span> (<span class="debug-value">src/shared/query/</span>) — так
      фильтр переживает перезагрузку и уезжает в ссылку. Здесь URL нарочно не задействован, иначе страница спорила бы
      с роутером на каждый клик.
    </p>

    <p class="debug-note">
      Поповеры уезжают в <span class="debug-value">#popover-root</span> в конце body, модалка карт — в
      <span class="debug-value">body</span> через свой Teleport. И то и другое снаружи
      <span class="debug-value">.debug-root</span>, поэтому классы <span class="debug-value">.debug-*</span> внутри
      попапов не работают: всё, что видно в карточке, стилизовано самими компонентами. Ещё поповеры пересчитывают
      позицию каждый кадр, пока открыты, — не оставляй десяток открытым.
    </p>

    <p class="debug-note">
      Все три поповерных селектора отдают в <span class="debug-value">PopoverAutoClose</span> общий
      <span class="debug-value">popoverViewportOffset</span> из шапки сайта
      (<span class="debug-value">pages/shared/header/useAdditionalHeaderHeight.ts</span>): сверху высота шапки + 10px,
      с остальных сторон 10px. Переопределить его на месте использования нельзя — пропа нет, только
      <span class="debug-value">closeOnOutsideWindow</span>. Подробнее про сам оффсет — на странице
      <a href="/debug/popover">Popover</a>.
    </p>

    <div class="debug-col">
      <div class="debug-row">
        <span class="debug-label">preferredGame (глобальный localStorage)</span>
        <span class="debug-value">{{ preferredGame }}</span>

        <button class="debug-btn" v-for="variant in gameVariants" :key="variant"
          :class="{ active: preferredGame === variant }" @click="preferredGame = variant">
          {{ variant }}
        </button>
      </div>

      <p class="debug-note">
        Кнопки «Lesta / WG» <b>внутри</b> попапов техники, карт и версий пишут не в свою модель, а в этот глобальный
        <span class="debug-value">preferredGame</span> (<span
          class="debug-value">shared/global/globalPreferred.ts</span>,
        ключ <span class="debug-value">preferred-game-variant</span>). То есть переключение игры в попапе техники молча
        меняет регион в попапе версий, список карт и предпочтение игры на всём сайте — и остаётся после перезагрузки.
        Отдельный <span class="debug-value">GameSelector</span> к нему, наоборот, не подключён вообще.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">Списки из ClickHouse (те же запросы, что внутри селекторов)</span>

      <table class="debug-table">
        <thead>
          <tr>
            <th>список</th>
            <th>статус</th>
            <th>строк</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in listStatuses" :key="item.title">
            <th>{{ item.title }}</th>
            <td :class="{ true: item.status === success, false: isErrorStatus(item.status) }">
              {{ statusText(item.status) }}
            </td>
            <td>{{ item.count }}</td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        Ни один из четырёх селекторов не смотрит на <span class="debug-value">status</span> запроса — в попап уезжает
        только <span class="debug-value">.data</span>. Поэтому упавший запрос выглядит ровно как вечная загрузка:
        крутилка и ничего больше. Проверяется только через devtools → offline, см.
        <a href="#data">данные списков</a>.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { isErrorStatus, loading, success, type Status } from '@/db'
import { preferredGame } from '@/shared/global/globalPreferred'
import { listStatuses } from '../shared/lists'

const gameVariants = ['mt', 'wot', 'any', 'unknown'] as const

function statusText(status: Status) {
  if (status === loading) return 'загрузка'
  if (status === success) return 'ок'
  if (isErrorStatus(status)) return `ошибка: ${status.reason}`
  return 'неизвестно'
}

</script>
