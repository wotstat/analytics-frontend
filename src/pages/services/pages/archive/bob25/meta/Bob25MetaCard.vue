<template>
  <MetaCard class="bob25-card" label="Архив" footer="Мир танков">
    <template #background>
      <MetaCardBackground class="scene" palette="violet">
        <img :src="background" alt="">
      </MetaCardBackground>
    </template>

    <template #content>
      <div class="overview">
        <div class="info">
          <h1>Битва<br>блогеров <span class="mt-font">2025</span></h1>
          <p>Очки, винрейт и статистика боёв</p>
        </div>

        <div class="teams">
          <figure v-for="(portrait, blogger) in portraits" :key="blogger">
            <img :src="portrait" :class="{ mirrored: blogger === 'yusha' }" alt="">
            <BloggerPlace :blogger />
            <figcaption>
              <BloggerName :blogger class="nickname" />
            </figcaption>
          </figure>
        </div>
      </div>
    </template>
  </MetaCard>
</template>

<script setup lang="ts">
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'
import MetaCardBackground from '@/shared/ui/meta/components/MetaCardBackground.vue'
import background from '../assets/background.webp'
import BloggerName from '../components/blogger/BloggerName.vue'
import BloggerPlace from '../components/blogger/BloggerPlace.vue'
import jove from '../components/blogger/jove.webp'
import lebwa from '../components/blogger/lebwa.webp'
import nearyou from '../components/blogger/nearyou.webp'
import yusha from '../components/blogger/yusha.webp'

const portraits = { nearyou, lebwa, jove, yusha }
</script>

<style scoped lang="scss">
.bob25-card {
  --meta-card-padding: 48px 56px 36px;
}

.scene {
  background-color: #0a0816;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.68;
  }

  &::after {
    background:
      linear-gradient(90deg, #0a0816 0%, #0a0816e8 35%, #0a081660 74%, #0a08164d),
      linear-gradient(0deg, #0a0816 0%, transparent 34%, transparent 78%, #0a0816b3);
  }
}

.overview {
  display: grid;
  grid-template-columns: 440px minmax(0, 1fr);
  gap: 24px;
  align-items: center;
}

.info {
  h1 {
    margin: 0;
    font-size: 65px;
    font-weight: 700;
    line-height: 1.04;
    white-space: nowrap;
    text-shadow: 0 0 26px #c55aff66, 0 0 8px #62d8ff52;
  }

  p {
    margin: 22px 0 0;
    color: var(--meta-card-muted);
    font-size: 25px;
    line-height: 1.35;
  }
}

.teams {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  figure {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
    margin: 0;
  }

  img {
    display: block;
    width: calc(100% + 28px);
    mask-image: linear-gradient(#000 58%, transparent);

    &.mirrored {
      scale: -1 1;
    }
  }

  .place {
    font-size: 142px;
  }

  figcaption {
    position: absolute;
    inset-inline: 0;
    bottom: 15%;
    text-align: center;

    .nickname {
      margin: 0;
      font-size: 30px;
      line-height: 1.15;
    }
  }
}
</style>
