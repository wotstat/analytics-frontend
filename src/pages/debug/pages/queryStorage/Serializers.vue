<template>
  <DebugSection title="Стандартные сериализаторы" id="serializers"
    source="src/shared/uiKit/queryStorage/serializers/"
    description="Меняйте исходную строку: ниже показаны модель и её каноническая запись. Некорректное значение вызывает ошибку; при использовании в queryStorage применяется default.">
    <div class="debug-row">
      <label class="debug-control">Сериализатор
        <select v-model="selected">
          <option v-for="(example, index) in examples" :key="example.name" :value="index">{{ example.name }}</option>
        </select>
      </label>
      <label class="debug-control">Исходная строка<input v-model="raw" /></label>
    </div>
    <pre class="debug-value">{{ JSON.stringify(result, null, 2) }}</pre>
    <p class="debug-note">Даты без часового пояса читаются как UTC; по умолчанию округляются до ближайшей секунды.
      Точность задаётся сериализатором. Запись только часов читается как :00 минут.
      Нулевые части времени и хвостовые нули миллисекунд убираются.
      В списке строк ~ означает пустой элемент, %2C — запятую, %7E — символ ~, %25 — процент.
      Числовой список с валидатором принимает только целые от 1 до 11.
      Массив сохраняет порядок и повторы; Set сохраняет порядок первого появления и убирает повторы.
      SetOf принимает только значения из заданного списка.</p>
  </DebugSection>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DebugSection from '../../shared/DebugSection.vue'
import { dateSerializer } from '@/shared/uiKit/queryStorage/serializers/dateSerializer'
import { stringSerializer } from '@/shared/uiKit/queryStorage/serializers/stringSerializer'
import { numberSerializer } from '@/shared/uiKit/queryStorage/serializers/numberSerializer'
import { oneOfSerializer } from '@/shared/uiKit/queryStorage/serializers/oneOfSerializer'
import { arraySerializer } from '@/shared/uiKit/queryStorage/serializers/arraySerializer'
import { setSerializer } from '@/shared/uiKit/queryStorage/serializers/setSerializer'
import { setOfSerializer } from '@/shared/uiKit/queryStorage/serializers/setOfSerializer'
import type { Serializer } from '@/shared/uiKit/queryStorage/serializers/types'

function example<T>(name: string, serializer: Serializer<T>, raw: string) {
  return {
    name, raw,
    read: (value: string) => {
      const model = serializer.deserialize(value)
      return { model: model instanceof Set ? { type: 'Set', values: [...model] } : model, encoded: serializer.serialize(model) }
    }
  }
}

const regions = oneOfSerializer(['RU', 'EU', 'NA', 'ASIA', 'CN'])
const date = dateSerializer()
const examples = [
  example('Дата: полночь', date, '2026-10-06T00:00:00.000Z'),
  example('Дата: только часы', date, '2026-10-07T10'),
  example('Дата: часы и минуты', date, '2026-10-06T02:00:00.000Z'),
  example('Дата: секунды', date, '2026-10-06T02:03:04.000Z'),
  example('Дата: миллисекунды', dateSerializer('millisecond'), '2026-10-06T02:03:04.120Z'),
  example('Дата: компактная запись', date, '2026-10-06T02:03:04.12'),
  example('Дата: часовой пояс', date, '2026-10-06T05:03:04+03:00'),
  example('Дата: округление до дня', dateSerializer('day'), '2026-10-06T12:00'),
  example('Дата: округление до часа', dateSerializer('hour'), '2026-10-06T10:30'),
  example('Дата: округление до минуты', dateSerializer('minute'), '2026-10-06T10:59:30'),
  example('Дата: округление до секунды', date, '2026-10-06T23:59:59.500Z'),
  example('Строка', stringSerializer, 'Текст с запятой, и процентом %'),
  example('Число', numberSerializer, '12.5'),
  example('Одно из значений', regions, 'RU'),
  example('Массив строк', arraySerializer(stringSerializer), 'танк,карта%2Cгород,~,%7E,100%25'),
  example('Массив чисел с валидатором', arraySerializer(numberSerializer, value => Number.isInteger(value) && value >= 1 && value <= 11), '1,5,10,5'),
  example('Массив допустимых значений', arraySerializer(regions), 'RU,EU,RU'),
  example('Set строк', setSerializer(stringSerializer), 'танк,карта%2Cгород,танк,~,%7E,100%25'),
  example('Set чисел с валидатором', setSerializer(numberSerializer, value => Number.isInteger(value) && value >= 1 && value <= 11), '1,5,10,5'),
  example('SetOf регионов', setOfSerializer(['RU', 'EU', 'NA', 'ASIA', 'CN']), 'RU,EU,RU'),
  example('SetOf уровней', setOfSerializer([1, 5, 10]), '10,1,10')
]
const selected = ref(0)
const raw = ref(examples[0].raw)
watch(selected, value => { raw.value = examples[value].raw })
const result = computed(() => {
  try { return examples[selected.value].read(raw.value) }
  catch (reason) { return { error: String(reason) } }
})
</script>
