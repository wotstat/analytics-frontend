<template>
  <DebugSection title="Расхождения: файлы vs i18n.ts" id="discrepancies"
    description="iconFileKeys — реальный список SVG из assets/. i18nIconKeys — ключи i18n.ts, входящие в IconType (isIconType). Несовпадение значит битую иконку без подписи или подпись без файла."
    source="src/shared/game/efficiencyIcon/i18n.ts">

    <table class="debug-table">
      <thead>
        <tr>
          <th>файл без подписи в IconType/i18n.ts</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!filesWithoutLabel.length">
          <td>нет расхождений</td>
        </tr>
        <tr v-for="key in filesWithoutLabel" :key="key">
          <td class="false">{{ key }}</td>
        </tr>
      </tbody>
    </table>

    <table class="debug-table">
      <thead>
        <tr>
          <th>подпись в i18n.ts без файла</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!labelsWithoutFile.length">
          <td>нет расхождений</td>
        </tr>
        <tr v-for="key in labelsWithoutFile" :key="key">
          <td class="false">{{ key }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-hint" v-if="nonIconI18nKeys.length">
      Ещё в i18n.ts есть {{ nonIconI18nKeys.length }} ключ(ей) вне IconType:
      <span class="debug-value" v-for="k in nonIconI18nKeys" :key="k">{{ k }}</span> —
      это подписи modificationLabel() («Всего»/«Ср.»/«Макс.»/…), не иконок, расхождением не считаются.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { isIconType } from '@/shared/game/efficiencyIcon/utils'
import { i18n } from '@/shared/game/efficiencyIcon/i18n'
import { iconFileKeys } from '../useIconFiles'

const i18nKeys = Object.keys(i18n.ru)
const i18nIconKeys = new Set<string>(i18nKeys.filter(isIconType))
const fileKeySet = new Set<string>(iconFileKeys)

const filesWithoutLabel = computed(() => iconFileKeys.filter(key => !i18nIconKeys.has(key)))
const labelsWithoutFile = computed(() => [...i18nIconKeys].filter(key => !fileKeySet.has(key)))
const nonIconI18nKeys = i18nKeys.filter(key => !isIconType(key))
</script>
