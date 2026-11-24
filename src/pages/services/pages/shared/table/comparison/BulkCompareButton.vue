<template>
  <CompareButton v-if="totalLines <= MAX_LINES"
    class="compare-all"
    :disabled="unavailable"
    v-tooltip="{ text: tooltip ?? '', disabled: !tooltip }"
    @click="compareAll" />

  <Teleport to="body">
    <ModalWindowContent v-if="pending"
      title="Слишком много линий"
      class="bulk-comparison-confirmation"
      role="dialog"
      aria-modal="true"
      aria-label="Слишком много линий"
      aria-describedby="bulk-comparison-warning"
      @close="close">
      <div id="bulk-comparison-warning" class="warning">
        <p>Вы пытаетесь добавить <b>{{ addedLines }}</b> {{ lineLabel }} в сравнение.</p>
        <ul>
          <li>Линии перекроют друг друга — сравнивать их будет сложно.</li>
          <li>График и страница могут тормозить.</li>
        </ul>
      </div>
      <template #footer-content>
        <div class="actions">
          <button type="button" @click="close">Отмена</button>
          <button type="button" @click="confirm">Всё равно добавить</button>
        </div>
      </template>
    </ModalWindowContent>
  </Teleport>
</template>

<script setup lang="ts" generic="Candidate">
import { computed, shallowRef, watch } from 'vue'
import ModalWindowContent from '@/shared/ui/modalWindow/ModalWindowContent.vue'
import CompareButton from './CompareButton.vue'

const CONFIRM_ABOVE = 20
const MAX_LINES = 100

const props = withDefaults(defineProps<{
  candidates: readonly Candidate[]
  comparisonCount: number
  linesPerCandidate?: number
  disabled?: boolean
  tooltip?: string
  filters: object
}>(), { linesPerCandidate: 1 })
const emit = defineEmits<{ compare: [candidates: readonly Candidate[]] }>()
const pending = shallowRef<readonly Candidate[] | null>(null)
const addedLines = computed(() => props.candidates.length * props.linesPerCandidate)
const totalLines = computed(() => props.comparisonCount * props.linesPerCandidate + addedLines.value)
const unavailable = computed(() => props.disabled || !addedLines.value || totalLines.value > MAX_LINES)
const pluralRules = new Intl.PluralRules('ru')
const lineLabel = computed(() => {
  const category = pluralRules.select(addedLines.value)
  if (category === 'one') return 'линию'
  if (category === 'few') return 'линии'
  return 'линий'
})

watch([() => props.candidates, () => props.comparisonCount, () => props.linesPerCandidate, () => props.disabled], close)
watch(() => props.filters, close, { deep: true })

function close() {
  pending.value = null
}

function compareAll() {
  if (unavailable.value) return
  if (totalLines.value > CONFIRM_ABOVE) {
    pending.value = props.candidates
    return
  }
  emit('compare', props.candidates)
}

function confirm() {
  const candidates = pending.value
  close()
  if (candidates !== props.candidates || unavailable.value) return
  emit('compare', candidates)
}
</script>

<style scoped lang="scss">
.bulk-comparison-confirmation {
  :deep(.modal) {
    width: 480px;
    height: auto;
    max-width: calc(100vw - 30px);
    margin: auto;
    border-radius: 15px;
  }

  .warning {
    margin: 10px 0;
    line-height: 1.5;

    p {
      margin: 0 0 12px;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li+li {
        margin-top: 6px;
      }
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 15px;

    button {
      min-height: 36px;
      padding: 7px 14px;
      border: 0;
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.08);
      color: white;
      font: inherit;
      font-size: 14px;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      }

      @media (max-width: 450px) {
        flex: 1;
      }
    }
  }
}
</style>
