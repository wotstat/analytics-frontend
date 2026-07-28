<template>
  <div class="debug-row">
    <label class="debug-control">
      <span class="debug-label">{{ label }}</span>
      <select v-model="form">
        <option v-for="item in forms" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    </label>

    <label class="debug-control" v-for="field in fields" :key="field">
      <span class="debug-label">{{ field }}</span>
      <input type="number" min="0" max="40" step="1" v-model="numbers[field]">
    </label>

    <span class="debug-hint">→ <span class="debug-value">{{ JSON.stringify(model) }}</span></span>
  </div>
</template>


<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import type { BarRadius } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'

type RadiusObject = {
  top?: number
  right?: number
  bottom?: number
  left?: number
  topLeft?: number
  topRight?: number
  bottomRight?: number
  bottomLeft?: number
}

type Field = 'radius' | keyof RadiusObject

const forms = [
  { value: 'number', label: 'число' },
  { value: 'pair', label: '[верх, низ]' },
  { value: 'quad', label: '[tl, tr, br, bl]' },
  { value: 'object', label: 'объект' },
] as const

type Form = typeof forms[number]['value']

const objectFields: (keyof RadiusObject)[] = [
  'top', 'right', 'bottom', 'left', 'topLeft', 'topRight', 'bottomRight', 'bottomLeft',
]

const fieldsByForm: Record<Form, Field[]> = {
  number: ['radius'],
  pair: ['top', 'bottom'],
  quad: ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'],
  object: objectFields,
}

defineProps<{ label: string }>()

const model = defineModel<BarRadius>({ required: true })

const form = ref<Form>('number')

// Пустое поле = не задано: у объектной формы это единственный способ увидеть
// цепочку подстановок topLeft ?? top ?? left ?? 0.
const numbers = ref<Record<Field, string>>({
  radius: '6',
  top: '8',
  right: '',
  bottom: '0',
  left: '',
  topLeft: '',
  topRight: '',
  bottomRight: '',
  bottomLeft: '',
})

const fields = computed(() => fieldsByForm[form.value])

watchEffect(() => model.value = compose())

function compose(): BarRadius {
  switch (form.value) {
    case 'number':
      return number('radius')

    case 'pair':
      return [number('top'), number('bottom')]

    case 'quad':
      return [number('topLeft'), number('topRight'), number('bottomRight'), number('bottomLeft')]

    case 'object': {
      const result: RadiusObject = {}
      for (const field of objectFields) {
        const value = optional(field)
        if (value !== undefined) result[field] = value
      }
      return result
    }
  }
}

function number(field: Field) {
  return optional(field) ?? 0
}

function optional(field: Field) {
  const raw = numbers.value[field]
  if (raw === '') return undefined
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? undefined : parsed
}

</script>
