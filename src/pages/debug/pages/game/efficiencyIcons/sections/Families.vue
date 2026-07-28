<template>
  <DebugSection title="Семейства" id="families"
    description="Группировка по efficiencyWithMods: для каждой метрики видно, какие из total/avg/max/in-row у неё реально есть. Пустая клетка — вариант не предусмотрен списком modifications, а не потерянная иконка."
    source="src/shared/game/efficiencyIcon/utils.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">направляющие</span>
        <input type="checkbox" v-model="guides">
      </label>
    </div>

    <div class="table-wrap">
      <table class="debug-table families">
        <thead>
          <tr>
            <th>метрика</th>
            <th v-for="col in COLUMNS" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.value">
            <th class="metric">
              <span>{{ label(row.value) }}</span>
              <span class="debug-value">{{ row.value }}</span>
            </th>
            <td v-for="(cellKey, i) in row.cells" :key="COLUMNS[i]">
              <div class="icon-cell" v-if="cellKey">
                <IconGuides v-if="guides" :size="32" />
                <Icon :icon="cellKey" class="icon" />
              </div>
              <span v-else class="dash">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="debug-note" v-if="uncoveredMetrics.length">
      В efficiency есть метрики, которых нет вообще ни в одном семействе efficiencyWithMods:
      <span class="debug-value" v-for="t in uncoveredMetrics" :key="t">{{ t }}</span>.
      «hp» не попал ни в одно семейство целиком, а у «position» модификации содержат только
      position-avg/position-max — базовый вариант потерян в списке modifications. При этом efficiencyWithMods сейчас
      нигде не импортируется в коде, кроме собственного определения — похоже на недописанную заготовку.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { efficiency, efficiencyWithMods, modificationLabel, IconType } from '@/shared/game/efficiencyIcon/utils'
import { i18n } from '@/shared/game/efficiencyIcon/i18n'
import IconGuides from '../shared/IconGuides.vue'

const COLUMNS = ['total', 'avg', 'max', 'in-row', 'in-row-max'] as const
const guides = ref(false)

function label(key: string) {
  return i18n.ru[key as IconType] ?? key
}

const rows = computed(() => efficiencyWithMods.map(family => ({
  value: family.value as string,
  cells: COLUMNS.map(col => family.modifications.find(m => modificationLabel(m) === col) ?? null)
})))

const coveredMods = new Set<IconType>(efficiencyWithMods.flatMap(f => f.modifications))
const uncoveredMetrics = efficiency.filter(t => !coveredMods.has(t))
</script>


<style scoped lang="scss">
.table-wrap {
  overflow-x: auto;
}

.families {
  th.metric {
    display: flex;
    flex-direction: column;
    gap: 0.1em;
    text-align: left;
    white-space: nowrap;
  }
}

.icon-cell {
  position: relative;
  width: 32px;
  height: 32px;
}

.icon {
  position: relative;
  width: 32px;
  height: 32px;
}

.dash {
  color: var(--debug-dim);
}
</style>
