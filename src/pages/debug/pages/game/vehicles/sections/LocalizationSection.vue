<template>
  <DebugSection title="Локализация имён" id="localization" source="src/shared/i18n/i18n.ts"
    description="Короткое/полное имя, сравнение по регионам, длинные имена и отсутствующая локализация.">

    <div class="debug-col" v-if="topTank">
      <p class="debug-label">короткое vs полное — getTankName(tag, short?)</p>
      <table class="debug-table">
        <thead>
          <tr>
            <th>tag</th>
            <th>short</th>
            <th>полное</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>{{ topTank.tag }}</th>
            <td>{{ getTankName(topTank.tag, true) }}</td>
            <td>{{ getTankName(topTank.tag, false) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="debug-hint">
        Оба пути используют <span class="debug-value">selectTagVehiclesLocalization</span> из общего
        <span class="debug-value">i18n.ts</span>: dictionary фильтруется по locale, затем выбирается регион по
        приоритету. Глобальный кеш и debug-запрос должны возвращать одинаковые значения.
      </p>
    </div>

    <div class="debug-col" v-if="multiRegionTank">
      <p class="debug-label">один tag, разные ключи region/locale в VehiclesLocalizationDictionary</p>
      <table class="debug-table">
        <thead>
          <tr>
            <th>tag</th>
            <th>RU / RU</th>
            <th>EU / EN</th>
            <th>CN / ZH_CN</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>{{ multiRegionTank.tag }}</th>
            <td>{{ multiRegionTank.nameRu }}</td>
            <td>{{ multiRegionTank.nameEn }}</td>
            <td>{{ multiRegionTank.nameZhCn }}</td>
          </tr>
        </tbody>
      </table>
      <p class="debug-hint">
        Сайт пока использует фиксированный <span class="debug-value">LOCALE = 'RU'</span>. Таблица показывает не
        старые языковые колонки, а три явных составных ключа словаря.
      </p>
    </div>

    <div class="debug-col" v-if="longestTank">
      <p class="debug-label">очень длинное имя в узкой карточке</p>
      <div class="debug-stage short">
        <div class="name-card">
          <VehicleImage :tag="longestTank.tag" size="small" class="w120" />
          <p class="debug-value">{{ getTankName(longestTank.tag) }}</p>
        </div>
      </div>
      <p class="debug-hint">{{ getTankName(longestTank.tag).length }} символов — карточка 140px, проверяем перенос.</p>
    </div>

    <div class="debug-col" v-if="missingLocalization.length">
      <p class="debug-label">отсутствующая локализация — фолбэк на tankTagToReadable(tag)</p>
      <table class="debug-table">
        <thead>
          <tr>
            <th>tag</th>
            <th>выбранное name</th>
            <th>getTankName(tag)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in missingLocalization" :key="v.tag">
            <th>{{ v.tag }}</th>
            <td>«{{ v.name }}»</td>
            <td>{{ getTankName(v.tag) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="debug-hint">
        Такие теги реально есть в БД без перевода (ивентовая/боевая-пропускная техника) —
        <span class="debug-value">getBestTankLocale</span> возвращает <span class="debug-value">null</span>, и
        <span class="debug-value">getTankName</span> собирает читаемое имя прямо из тега.
      </p>
    </div>

    <div class="debug-col">
      <p class="debug-label">сломать нарочно</p>
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">тег без "nation:"</span>
          <input type="text" v-model="noColonTag">
        </label>
        <span class="debug-hint">tankTagToReadable → <span class="debug-value">{{ tankTagToReadable(noColonTag)
            }}</span></span>
      </div>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">произвольное имя</span>
          <input type="text" v-model="customName" placeholder="пусто — проверить схлопывание строки">
        </label>
      </div>
      <div class="debug-stage short">
        <div class="name-card">
          <p class="debug-value" v-if="customName">{{ customName }}</p>
          <p class="debug-hint" v-else>(пустая строка — тут пусто, высота строки не схлопывается благодаря line-height)
          </p>
        </div>
      </div>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import { getTankName, tankTagToReadable } from '@/shared/i18n/i18n'
import { vehicleList, vehiclesWithoutLocalization } from '../store'

const topTank = computed(() => vehicleList.value[0])

const multiRegionTank = computed(() =>
  vehicleList.value.find(v => v.tag === 'china:Ch24_Type64_SH')
)

const longestTank = computed(() =>
  vehicleList.value.find(v => v.tag === 'ussr:R211_Object_261_4')
)

const missingLocalization = computed(() => vehiclesWithoutLocalization.value.slice(0, 6))

const noColonTag = ref('justatag')
const customName = ref('')
</script>


<style scoped lang="scss">
.name-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4em;
  width: 140px;
  text-align: center;
}

.w120 {
  width: 120px;
}
</style>
