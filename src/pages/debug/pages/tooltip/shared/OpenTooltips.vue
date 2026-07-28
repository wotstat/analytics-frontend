<template>
  <div class="debug-col">
    <span class="debug-label">Открытые тултипы: {{ rows.length }}</span>

    <table class="debug-table">
      <thead>
        <tr>
          <th>группа</th>
          <th>цель</th>
          <th>placement</th>
          <th>interactive</th>
          <th>delay</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0">
          <td colspan="5">— ничего не открыто —</td>
        </tr>

        <tr v-for="row in rows" :key="row.group">
          <th>{{ row.group }}</th>
          <td>{{ row.trigger }}</td>
          <td>{{ row.placement }}</td>
          <td :class="row.interactive ? 'true' : 'false'">{{ row.interactive }}</td>
          <td>{{ row.delay }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { displayedTooltips } from '@/shared/uiKit/tooltip/tooltip'

// props.placement — это запрошенный placement, а не выбранный после перебора:
// наружу выбранный вариант тултип не отдаёт, его видно только по стрелке карточки.
const rows = computed(() => [...displayedTooltips.value].map(([group, tooltip]) => ({
  group,
  trigger: tooltip.trigger.textContent?.trim().slice(0, 20) || '—',
  placement: JSON.stringify(tooltip.props.placement ?? null),
  interactive: tooltip.options.interactive,
  delay: tooltip.options.delay,
})))

</script>
