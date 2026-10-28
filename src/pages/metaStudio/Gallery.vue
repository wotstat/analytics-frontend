<template>
  <section class="gallery">
    <header class="gallery-heading">
      <h1>Карточки страниц</h1>
      <p>Выберите карточку для просмотра.</p>
    </header>

    <section v-for="group in studioCardGroups" :key="group.name" class="gallery-group">
      <h2>{{ group.name }}</h2>
      <div class="gallery-grid">
        <RouterLink v-for="card in group.cards" :key="card.id" :to="`/meta/cards/${card.id}`" class="gallery-card">
          <div class="card-thumbnail">
            <ScaledCard v-if="card.component && card.examples.length" :context="exampleContext(card)" />
            <div v-else class="text-preview">{{ card.component ? 'Нет примера' : 'Без изображения' }}</div>
          </div>
          <div class="card-info">
            <div class="card-heading">
              <h3>{{ card.name }}</h3>
              <span class="open-arrow">→</span>
            </div>
            <p v-if="card.summary">{{ card.summary }}</p>
            <code>{{ card.id }}</code>
          </div>
        </RouterLink>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { RenderContext } from '@/meta/utils'
import { getBrowserMetaResolver } from '@/meta/context/browser'
import ScaledCard from './ScaledCard.vue'
import { studioCards, studioCardGroups } from './utils/catalog'

const exampleContext = (card: (typeof studioCards)[number]): RenderContext => {
  const url = card.examples[0].url
  const request = { url }
  return { url, format: 'og', meta: getBrowserMetaResolver().readMeta(new URL(url), request), request }
}
</script>

<style scoped lang="scss">
.gallery {
  h1, h2, h3, p {
    margin: 0;
  }

  .gallery-heading {
    margin-bottom: 24px;

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

  .gallery-group {
    & + .gallery-group {
      margin-top: 36px;
    }

    > h2 {
      margin-bottom: 18px;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 32px 24px;

    .gallery-card {
      display: block;
      min-width: 0;
      margin: -10px;
      padding: 10px;
      border-radius: 4px;
      color: inherit;
      text-decoration: none;
      transition: background-color .16s ease;

      &:hover {
        background: var(--studio-surface);
      }

      .card-thumbnail {
        overflow: hidden;
        border-radius: 3px;

        .text-preview {
          aspect-ratio: 1200 / 630;
          display: grid;
          place-items: center;
          color: var(--studio-muted);
          background: var(--studio-canvas);
          font-size: 12px;
        }
      }

      .card-info {
        margin-top: 14px;

        .card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          h3 {
            font-size: 16px;
            font-weight: 600;
            line-height: 1.4;
          }

          .open-arrow {
            font-size: 20px;
            color: var(--studio-muted);
          }
        }

        p {
          margin-top: 5px;
          color: var(--studio-muted);
        }

        code {
          display: block;
          margin-top: 12px;
          color: var(--studio-muted);
          font-family: var(--studio-mono);
          font-size: 11px;
          overflow-wrap: anywhere;
          white-space: normal;
        }
      }
    }
  }
}
</style>
