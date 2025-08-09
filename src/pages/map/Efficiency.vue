
<template>
  <PopupWindow @close="emit('close')" :title="'Метрика эффективности'">

    <h4>Введите выражение определяющее эффективность выстрела</h4>
    <div class="flex">
      <textarea class="flex-1" rows="5" v-model="currentExpression" @keydown.enter="onEnterClick"></textarea>
    </div>
    <div class="error" v-if="exceptionText">
      {{ exceptionText }}
    </div>

    <div>
      <div class="flex">
        <p>Автоматический перерасчёт</p>
        <input type="checkbox" v-model="autoRecalculation">
      </div>
      <p v-if="!autoRecalculation">Используйте CTRL+Enter в текстовом поле для перерасчёт</p>
    </div>

    <h4>Границы отображения</h4>
    <div :class="minMax == null ? 'disabled' : ''">
      <div class="flex">
        <p>От</p>
        <input class="flex-1" type="range" step="0.001" v-model="selectedMin" :min="minMax?.[0] ?? 0"
          :max="minMax?.[1] ?? 0" :disabled="minMax == null">
        <input type="number" v-model="selectedMin" :disabled="minMax == null">
      </div>
      <div class="flex">
        <p>До</p>
        <input class="flex-1" type="range" step="0.001" v-model="selectedMax" :min="minMax?.[0] ?? 0"
          :max="minMax?.[1] ?? 0" :disabled="minMax == null">
        <input type="number" v-model="selectedMax" :disabled="minMax == null">
      </div>
    </div>
    <hr>
    <button :disabled="minMax == null" @click="apply">Применить</button>
  </PopupWindow>
</template>


<script setup lang="ts">
import PopupWindow from '@/components/PopupWindow.vue'
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams'
import { query, queryAsyncFirst } from '@/db'
import { useDebounce, useLocalStorage } from '@vueuse/core'
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  value: {
    expression: string,
    from: number,
    to: number
  },
}>()

const currentExpression = ref<string>(props.value.expression)
const debounceExpression = useDebounce(currentExpression, 800)
const minMax = ref<[number, number] | null>(null)
const autoRecalculation = useLocalStorage('ExpressionAutoRecalculation', true)

const selectedMin = ref(0)
const selectedMax = ref(0)
const exceptionText = ref('')

const emit = defineEmits<{
  'select': [{ from: number, to: number, expression: string }],
  'close': []
}>()


const params = useQueryStatParams()

watch(currentExpression, () => {
  minMax.value = null
  exceptionText.value = ''
})

watch(debounceExpression, () => {
  if (autoRecalculation.value) refresh()
})

function apply() {
  emit('close')
  emit('select', { from: selectedMin.value, to: selectedMax.value, expression: currentExpression.value })
}

let isFirst = true
onMounted(() => refresh())
async function refresh() {
  const value = currentExpression.value

  const queryStr = `
  WITH toFloat64(${value}) AS value
  SELECT min(value) AS min, 
         max(value) AS max
  FROM Event_OnShot
  ${whereClause(params)}
  `

  try {
    const res = await query<{ min: 0, max: 0 }>(queryStr)

    minMax.value = [res.data[0].min, res.data[0].max]
    nextTick(() => {
      selectedMin.value = selectedMin.value + 1
      selectedMax.value = selectedMax.value + 1
      nextTick(() => {
        selectedMin.value = isFirst ? props.value.from : res.data[0].min
        selectedMax.value = isFirst ? props.value.to : res.data[0].max
        isFirst = false
      })
    })
  } catch (e) {
    const t = queryStr.replace(/\s+/g, ' ').replaceAll('where', 'WHERE').trim()
    if (e && typeof e == 'object' && 'message' in e && typeof e.message === 'string')
      exceptionText.value = e.message.replace(t, '{{ QUERY }}')
    console.error(e)
    minMax.value = null
  }
}

function onEnterClick(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey && e.key === 'Enter') {
    refresh()
  }
}

</script>

<style scoped lang="scss">
.disabled {}

button:disabled {
  background-color: #505050;
  cursor: not-allowed;

  &:hover {
    border: 1px solid transparent;
  }
}

.flex {
  align-items: center;
}

.error {
  max-width: 600px;
  background-color: #5f3434ad;
  border-radius: 10px;
  padding: 10px;
}

textarea {
  width: 600px;
  resize: vertical;
  min-height: 1em;
}

h4 {
  margin: 0;
}
</style>