<template>
  <DebugSection title="Селектор техники" id="vehicle"
    description="Открытие поповера, выбор нескольких, фильтры внутри попапа, «выбрать всё» и сброс. Внизу — тот же попап, но привязанный к произвольной цели через VehicleSelector."
    source="src/shared/game/selectors/vehicleSelector/">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">closeOnOutsideWindow</span>
        <select v-model="closeOnOutsideWindow">
          <option v-for="variant in closeVariants" :key="variant" :value="variant">{{ variant }}</option>
        </select>
      </label>

      <button class="debug-btn" @click="addTags(take(vehicleTags, 3))">+3 тега</button>
      <button class="debug-btn" @click="addTags(take(vehicleTags, 40))">+40 тегов</button>
      <button class="debug-btn" @click="addTags(vehicleTags)">выбрать всё ({{ vehicleTags.length }})</button>
      <button class="debug-btn" @click="addTags(brokenVehicleTags)">+ мусорные теги</button>
    </div>

    <div class="debug-stage">
      <div class="selector-box">
        <p>Танк:</p>
        <VehicleSelectorBadges v-model="selected" :close-on-outside-window="closeOnOutsideWindow" />
      </div>
    </div>

    <SelectionReadout v-model="selected" :tag-to-text="tag => getTankName(tag, true)" :total="vehicleTags.length" />

    <p class="debug-note">
      Фильтры в шапке попапа (уровни, типы, нации) умеют модификаторы, и это нигде не описано: одиночный клик
      <b>заменяет</b> выбор, <span class="debug-value">Ctrl</span>/<span class="debug-value">Cmd</span> добавляет,
      <span class="debug-value">Shift</span> берёт диапазон от уже выбранного, повторный клик по активному — снимает.
      Кнопка сброса в заголовке гасит только эти фильтры и поиск; выбранная техника остаётся — проверь, что бейджи не
      обнулились.
    </p>

    <p class="debug-note">
      Переключатель <b>полн./сокр.</b> в шапке таблицы пишет в localStorage
      (<span class="debug-value">preferred-vehicle-name-variant</span>) и заодно меняет, по какому имени идёт поиск: в
      режиме «сокр.» запрос «Объект 268 Вариант 4» не найдёт ничего, потому что искать он будет по
      «Об. 268/4». В бейджах при этом всегда короткое имя — <span class="debug-value">getTankName(tag, true)</span>.
    </p>

    <p class="debug-note">
      Таблица виртуализирована (<span class="debug-value">TableView</span>), строки переиспользуются: после «выбрать
      всё» синими обязаны быть все строки, включая те, до которых доскроллишь потом. Группы («Стальной Охотник»,
      «Гонки», «Тестовые», …) — хардкод по суффиксам тега в
      <span class="debug-value">VehiclePopup.vue</span>, а не данные из БД.
    </p>

    <p class="debug-note">
      Тач: попап открывается тапом по «+»/«выбрать»; закрытие тапом вне считается по
      <span class="debug-value">pointerup</span> с порогом 5px и 500ms, поэтому прокрутка списка пальцем закрывать его
      не должна. Проверь ещё, что автофокус поиска <b>не</b> вызвал экранную клавиатуру: в
      <span class="debug-value">SearchLine</span> он включается только при
      <span class="debug-value">(hover: hover) and (pointer: fine)</span>.
    </p>

    <div class="debug-col">
      <span class="debug-label">VehicleSelector: тот же попап у произвольной цели</span>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">singleSelect</span>
          <input type="checkbox" v-model="singleSelect">
        </label>

        <label class="debug-control">
          <span class="debug-label">displayPopup</span>
          <input type="checkbox" v-model="displayPopup">
        </label>
      </div>

      <div class="debug-stage center short">
        <button class="debug-btn" ref="target" @click="displayPopup = !displayPopup">цель поповера</button>

        <VehicleSelector :target-element="target" :single-select="singleSelect" v-model="selected"
          v-model:display-popup="displayPopup" />
      </div>

      <p class="debug-note">
        <span class="debug-value">VehicleSelector.vue</span> в проекте не используется ни разу (живёт только
        <span class="debug-value">VehicleSelectorBadges</span>), и его проп
        <span class="debug-value">singleSelect</span> объявлен, но нигде не читается — ни в шаблоне, ни в скрипте.
        Включи галку и убедись, что выбирается всё равно сколько угодно танков. Модель здесь общая с бейджами выше:
        выбор из этого попапа сразу виден в строке бейджей.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import VehicleSelectorBadges from '@/shared/game/selectors/vehicleSelector/VehicleSelectorBadges.vue'
import VehicleSelector from '@/shared/game/selectors/vehicleSelector/VehicleSelector.vue'
import { getTankName } from '@/shared/i18n/i18n'
import type { CloseOnOutsideWindow } from '@/shared/uiKit/popover/utils'
import SelectionReadout from '../shared/SelectionReadout.vue'
import { brokenVehicleTags } from '../shared/fixtures'
import { take, vehicleTags } from '../shared/lists'

const closeVariants: CloseOnOutsideWindow[] = ['target', 'popover', 'popover-full']

const selected = ref(new Set<string>())
const closeOnOutsideWindow = ref<CloseOnOutsideWindow>('target')
const singleSelect = ref(false)
const displayPopup = ref(false)
const target = useTemplateRef<HTMLElement>('target')

function addTags(tags: readonly string[]) {
  for (const tag of tags) selected.value.add(tag)
}

</script>


<style scoped lang="scss">
.selector-box {
  display: flex;
  align-items: baseline;
  gap: 0.3em;
  max-width: 420px;
  font-size: 18px;
}
</style>
