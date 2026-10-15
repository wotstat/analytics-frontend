<template>
  <div class="meta-studio">
    <header class="studio-header">
      <div class="studio-header-inner">
        <RouterLink to="/meta" class="studio-brand">WotStat <span>/</span> <span>Meta Studio</span></RouterLink>
        <RouterLink to="/" class="site-link">На сайт ↗</RouterLink>
      </div>
    </header>

    <div class="studio-workspace">
      <nav class="studio-sidebar">
        <RouterLink to="/meta" class="catalog-link" exact-active-class="active">Все карточки <span>{{ cards.length
        }}</span></RouterLink>
        <div class="card-links">
          <RouterLink v-for="card in cards" :key="card.id" :to="`/meta/cards/${card.id}`" active-class="active">
            {{ card.name }}
          </RouterLink>
        </div>
      </nav>

      <main class="studio-main">
        <form class="url-form" novalidate @submit.prevent="openUrl">
          <label for="studio-page-url">Ссылка на страницу</label>
          <div class="url-input-row">
            <input
              id="studio-page-url"
              :value="effectiveUrl"
              type="url"
              placeholder="https://wotstat.info/…"
              spellcheck="false"
              @input="updateUrl">
            <button type="submit">Посмотреть</button>
          </div>
          <p v-if="urlError" class="input-error">{{ urlError }}</p>
        </form>
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { metaDefinitions as cards, parsePageUrl, matchMetaDefinition } from '@/meta/utils'
import { useNoIndex } from '@/pages/debug/shared/useNoIndex'
import { getStudioUrl, useStudioState } from './state/studioState'

const route = useRoute()
const router = useRouter()
const studioState = useStudioState()
const freeUrl = ref('')
const submitted = ref(false)
const selectedCard = computed(() => {
  if (!route.params.id) return null
  return cards.find(card => card.id === route.params.id) ?? cards[0]
})
const effectiveUrl = computed(() => {
  const card = selectedCard.value
  if (!card) return freeUrl.value
  return getStudioUrl(card, studioState.value[card.id])
})
const parsedUrl = computed(() => {
  try { return parsePageUrl(effectiveUrl.value.trim()) } catch { return null }
})
const urlError = computed(() => {
  if (!submitted.value && (!selectedCard.value || !effectiveUrl.value.trim())) return ''
  if (parsedUrl.value) return ''
  return 'Укажите полный адрес страницы с https:// или http://.'
})

const updateUrl = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  submitted.value = false
  const card = selectedCard.value
  if (!card) {
    freeUrl.value = value
    return
  }
  const cardState = studioState.value[card.id]
  cardState.customUrl = value
  cardState.mode = 'url'
}

const openUrl = () => {
  submitted.value = true
  const url = parsedUrl.value
  if (!url) return

  const { id: definitionId } = matchMetaDefinition(url)
  const cardState = studioState.value[definitionId]
  cardState.customUrl = url.href
  cardState.mode = 'url'
  freeUrl.value = url.href
  void router.push(`/meta/cards/${definitionId}`)
}

useNoIndex()
</script>

<style scoped lang="scss">
.meta-studio {
  --studio-bg: #242424;
  --studio-surface: #2c2c2c;
  --studio-canvas: #1d1d1d;
  --studio-hover: #3c3c3c;
  --studio-text: #e6e6e6;
  --studio-muted: #9b9b9b;
  --studio-mono: SFMono-Regular, Consolas, 'Liberation Mono', monospace;

  min-height: 100vh;
  color: var(--studio-text);
  background: var(--studio-bg);
  font-size: 13px;
  line-height: 1.5;

  &,
  :deep(*) {
    box-sizing: border-box;
  }

  :deep(br) {
    display: inline;
    margin: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .studio-header-inner,
  .studio-workspace {
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
  }

  .studio-header {
    height: 52px;

    .studio-header-inner {
      height: 100%;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      .studio-brand {
        display: flex;
        align-items: center;
        gap: 14px;
        font-weight: 600;

        span {
          color: var(--studio-muted);
          font-weight: 400;
        }
      }

      .site-link {
        color: var(--studio-muted);
        font-size: 12px;

        &:hover {
          color: var(--studio-text);
        }
      }
    }
  }

  .studio-workspace {
    --studio-content-top: 28px;

    display: grid;
    grid-template-columns: 212px minmax(0, 1fr);
    min-height: calc(100vh - 52px);

    .studio-sidebar {
      padding: calc(var(--studio-content-top) - 10px) 12px 20px;

      a {
        display: flex;
        align-items: center;
        min-height: 38px;
        padding: 8px 12px;
        border-radius: 8px;
        color: var(--studio-muted);

        &:hover {
          color: var(--studio-text);
          background: var(--studio-surface);
        }

        &.active {
          color: var(--studio-text);
          background: #353535;
        }
      }

      .catalog-link {
        display: flex;
        justify-content: space-between;
        gap: 8px;

        span {
          color: var(--studio-muted);
          font-variant-numeric: tabular-nums;
        }
      }

      .card-links {
        margin-top: 12px;
        padding-top: 12px;
      }
    }

    .studio-main {
      width: 100%;
      min-width: 0;
      padding: var(--studio-content-top) 32px 48px;

      .url-form {
        margin-bottom: 28px;

        >label {
          display: block;
          margin-bottom: 7px;
          font-size: 12px;
        }

        .url-input-row {
          display: flex;
          gap: 8px;

          input,
          button {
            height: 38px;
            border: 0;
            border-radius: 4px;
            color: inherit;
            font: inherit;
            font-size: 12px;
          }

          input {
            flex: 1;
            min-width: 0;
            padding: 8px 12px;
            background: var(--studio-canvas);
            font-family: var(--studio-mono);

            &::placeholder {
              color: #777;
            }
          }

          button {
            flex-shrink: 0;
            padding: 0 16px;
            background: var(--studio-surface);

            &:hover {
              background: var(--studio-hover);
            }
          }
        }

        .input-error {
          margin: 10px 0 0;
          color: #e7aa8c;
          font-size: 12px;
        }
      }
    }

    @media (max-width: 1000px) {
      --studio-content-top: 24px;

      grid-template-columns: 180px minmax(0, 1fr);

      .studio-main {
        padding: var(--studio-content-top) 24px 24px;
      }
    }

    @media (max-width: 700px) {
      grid-template-columns: 1fr;
      align-content: start;

      .studio-sidebar {
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 4px;
        overflow-x: auto;

        a {
          white-space: nowrap;
        }

        .card-links {
          display: flex;
          gap: 4px;
          margin: 0;
          padding: 0 0 0 4px;
        }
      }

      .studio-main {
        padding: var(--studio-content-top) 16px 32px;
      }
    }
  }
}
</style>
