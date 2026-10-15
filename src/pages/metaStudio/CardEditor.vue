<template>
  <section class="card-editor">
    <header class="editor-heading">
      <div class="card-details">
        <h1>{{ selectedCard.name }}</h1>
        <p v-if="selectedCard.summary">{{ selectedCard.summary }}</p>
      </div>
      <label v-if="selectedCard.examples.length" class="example-field">
        <span>Пример</span>
        <select :value="cardState.mode === 'examples' ? String(cardState.exampleIndex) : 'url'" @change="selectExample">
          <option value="url">Свой URL</option>
          <option v-for="(example, index) in selectedCard.examples" :key="example.url" :value="String(index)">
            {{ example.name }}
          </option>
        </select>
      </label>
    </header>

    <p v-if="context && context.meta.definitionId !== selectedCard.id" class="route-note">
      Эта ссылка использует карточку «{{ matchedCard.name }}».
      <RouterLink :to="`/meta/cards/${matchedCard.id}`">Открыть карточку →</RouterLink>
    </p>

    <div v-if="context" class="editor-workspace">
      <section class="preview-panel">
        <div class="preview-toolbar">
          <div class="preview-tabs">
            <button :class="{ active: cardState.previewMode === 'card' }" @click="cardState.previewMode = 'card'">Карточка</button>
            <button :class="{ active: cardState.previewMode === 'social' }" @click="cardState.previewMode = 'social'">В сервисах</button>
          </div>
          <select v-if="cardState.previewMode !== 'social' && context.meta.hasImage" v-model="cardState.format">
            <option value="og">Open Graph</option>
            <option value="twitter">X / Twitter</option>
          </select>
        </div>

        <div v-if="cardState.previewMode === 'social'" class="social-panel">
          <section v-for="platform in platforms" :key="platform.id" class="platform-preview">
            <h2>{{ platform.name }}</h2>
            <SocialPreview :context :platform />
          </section>
        </div>
        <div v-else-if="!context.meta.hasImage" class="empty-preview">Для этой страницы изображение не задано.</div>
        <RenderPreview v-else :url="context.url" :format="cardState.format" :meta="context.meta" />
      </section>

      <aside class="metadata-panel">
        <h2>Метаданные</h2>
        <dl>
          <dt>Шаблон</dt>
          <dd><code>{{ context.meta.definitionId }}</code></dd>
          <dt>title</dt>
          <dd>{{ context.meta.title }}</dd>
          <template v-if="context.meta.description !== undefined">
            <dt>description</dt>
            <dd>{{ context.meta.description }}</dd>
          </template>
          <template v-if="context.meta.hasImage && context.meta.imageAlt !== undefined">
            <dt>image alt</dt>
            <dd>{{ context.meta.imageAlt }}</dd>
          </template>
        </dl>
        <div class="cache-info">
          <h3>Кеш</h3>
          <div><span>HTML</span><span>{{ context.meta.cache.htmlSeconds }} с</span></div>
          <div v-if="context.meta.hasImage"><span>Изображение</span><span>{{ context.meta.cache.imageSeconds }} с</span></div>
        </div>
      </aside>
    </div>
    <p v-else class="empty-preview">Введите ссылку или выберите пример для просмотра карточки.</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { parsePageUrl, type MetaFormat, type RenderContext } from '@/meta/utils'
import { metaDefinitions as cards } from '@/meta/resolver'
import { getBrowserMetaResolver } from '@/meta/context/browser'
import RenderPreview from './RenderPreview.vue'
import SocialPreview from './SocialPreview.vue'
import { getStudioUrl, useStudioState } from './state/studioState'

const route = useRoute()
const selectedCard = computed(() => cards.find(card => card.id === route.params.id) ?? cards[0])
const studioState = useStudioState()
const cardState = computed(() => studioState.value[selectedCard.value.id])

const effectiveUrl = computed(() => getStudioUrl(selectedCard.value, cardState.value))
const parsedUrl = computed(() => {
  try { return parsePageUrl(effectiveUrl.value) } catch { return null }
})
const context = computed<RenderContext | null>(() => {
  if (!parsedUrl.value) return null
  return { url: parsedUrl.value.href, format: cardState.value.format, meta: getBrowserMetaResolver().readMeta(parsedUrl.value) }
})
const matchedCard = computed(() => cards.find(card => card.id === context.value?.meta.definitionId) ?? cards[0])

const platforms: { id: string, name: string, format: MetaFormat }[] = [
  { id: 'telegram', name: 'Telegram', format: 'og' },
  { id: 'x', name: 'X / Twitter', format: 'twitter' },
  { id: 'discord', name: 'Discord', format: 'og' },
  { id: 'slack', name: 'Slack', format: 'og' },
]

const selectExample = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'url') {
    cardState.value.mode = 'url'
    return
  }
  cardState.value.exampleIndex = Number(value)
  cardState.value.mode = 'examples'
}
</script>

<style scoped lang="scss">
.card-editor {
  h1, h2, h3, p {
    margin: 0;
  }

  button, select {
    font: inherit;
    color: inherit;
  }

  select {
    appearance: none;
    min-width: 0;
    border: 0;
    border-radius: 4px;
    background-color: var(--studio-canvas);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='m1 1 5 5 5-5' fill='none' stroke='%23e6e6e6' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    cursor: pointer;
    padding: 8px 34px 8px 12px;
  }

  .editor-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;

    .card-details {
      min-width: 0;

      h1 {
        font-size: 22px;
        font-weight: 600;
        line-height: 1.3;
      }

      p {
        margin-top: 6px;
        color: var(--studio-muted);
      }
    }

    .example-field {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      font-size: 12px;

      > span {
        color: var(--studio-muted);
      }

      select {
        max-width: 240px;
        height: 38px;
      }
    }

    @media (max-width: 900px) {
      flex-direction: column;
      gap: 14px;

      .example-field {
        width: 100%;

        select {
          min-width: 0;
          max-width: calc(100% - 60px);
          margin-left: auto;
        }
      }
    }
  }

  .route-note {
    margin-bottom: 16px;
    font-size: 12px;
    color: #e7aa8c;

    a {
      display: inline-block;
      margin-left: 6px;
      color: var(--studio-text);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }

  .empty-preview {
    display: grid;
    place-items: center;
    min-height: 220px;
    padding: 24px;
    background: var(--studio-canvas);
    color: var(--studio-muted);
    text-align: center;
    border-radius: 4px;
  }

  .editor-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 28px;
    align-items: start;

    .preview-panel {
      min-width: 0;

      .preview-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        min-height: 43px;
        margin-bottom: 16px;

        .preview-tabs {
          display: flex;
          gap: 20px;
          align-self: stretch;

          button {
            padding: 9px 0;
            border-bottom: 2px solid transparent;
            color: var(--studio-muted);
            white-space: nowrap;

            &:hover, &.active {
              color: var(--studio-text);
            }

            &.active {
              border-bottom-color: var(--studio-text);
            }

          }
        }

        > select {
          padding: 5px 34px 5px 12px;
          font-size: 12px;
          margin-bottom: 6px;
        }
      }

      .social-panel {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
        gap: 24px;

        .platform-preview {
          display: grid;
          grid-template-rows: auto 1fr;
          min-width: 0;

          h2 {
            margin-bottom: 10px;
            font-size: 13px;
            font-weight: 600;
          }
        }
      }
    }

    .metadata-panel {
      min-width: 0;
      padding-left: 24px;

      h2 {
        font-size: 13px;
        font-weight: 600;
        line-height: 43px;
      }

      dl {
        margin: 16px 0 24px;

        dt {
          color: var(--studio-muted);
          font-size: 11px;
          margin: 18px 0 5px;
          font-family: var(--studio-mono);
        }

        dd {
          margin: 0;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;

          code {
            font-family: var(--studio-mono);
            font-size: 11px;
            white-space: normal;
          }
        }
      }

      .cache-info {
        padding-top: 16px;
        font-size: 12px;

        h3 {
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 10px;
        }

        > div {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 6px;

          span:first-child {
            color: var(--studio-muted);
          }

          span:last-child {
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }
        }
      }
    }

    @media (max-width: 1150px) {
      grid-template-columns: 1fr;
      gap: 24px;

      .metadata-panel {
        padding-left: 0;

        dl {
          display: grid;
          grid-template-columns: 110px minmax(0, 1fr);
          gap: 12px 16px;

          dt {
            margin: 0;
          }
        }

        .cache-info {
          max-width: 300px;
        }
      }
    }

    @media (max-width: 500px) {
      .preview-panel {
        .preview-toolbar {
          flex-wrap: wrap;
          gap: 8px;

          .preview-tabs {
            gap: 16px;
          }
        }

      }

      .metadata-panel dl {
        grid-template-columns: 1fr;
        gap: 4px;

        dt:not(:first-child) {
          margin-top: 12px;
        }
      }
    }
  }
}
</style>
