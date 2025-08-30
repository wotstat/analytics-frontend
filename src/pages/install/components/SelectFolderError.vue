<template>
  <PopupWindow :title="'Игра не обнаружена'">
    <div class="page">


      <div class="mods-like" v-if="looksLikeModsFolder">
        <p class="bold">Почти правильно</p>

        <p>
          Вы выбрали папку <code>{{ props.handle.name }}</code>, а надо корневую папку игры.
        </p>


        <div class="path">
          <span>.../</span>
          <span class="target">GAME</span>
          <span>/</span>
          <span class="current">{{ props.handle.name }}</span>
          <span>/</span>
          <span>{{ latestGameVersion?.lesta.modsFolder }}</span>
        </div>
      </div>


      <div class="version-folder-like" v-else-if="looksLikeModsVersionFolder">
        <p class="bold">Почти правильно</p>

        <p>
          Вы выбрали папку с версией <code>{{ props.handle.name }}</code>, а надо корневую папку игры.
        </p>


        <div class="path">
          <span>.../</span>
          <span class="target">GAME</span>
          <span>/</span>
          <span>mods</span>
          <span>/</span>
          <span class="current">{{ props.handle.name }}</span>
        </div>
      </div>


      <div class="not-a-game" v-else>

        <div class="layout">

          <div class="info">
            <p class="bold">Папка <code>{{ props.handle.name }}</code> не является папкой игры.</p>

            <div class="spacer"></div>

            <p>
              Необходимо выбрать папку в которую у вас
              установлена игра, в ней должны быть файлы <code>Tanki.exe</code> или <code>WorldOfTanks.exe</code>, а так
              же
              папка <code>mods</code>.
            </p>

            <div class="spacer"></div>

            <p>
              Определить эту папку можно с помощью лаунчера игры: нажмите кнопку <code>Настройки игры</code> →
              <code>Показать в папке</code>.
            </p>
          </div>

          <div class="center">
            <img :src="ShowGameFolder" alt="show-game-folder">
          </div>
        </div>
      </div>

    </div>
  </PopupWindow>
</template>


<script setup lang="ts">
import PopupWindow from '@/shared/ui/PopupWindow.vue'
import { computedAsync } from '@vueuse/core'
import { computed } from 'vue'

import ShowGameFolder from '../assets/show-game-folder.jpg'
import { latestGameVersion } from '@/shared/game/gameVersion'

const props = defineProps<{
  handle: FileSystemDirectoryHandle
}>()

async function fromAsync<T>(it: AsyncIterable<T>) {
  const result: T[] = []
  for await (const value of it) result.push(value)
  return result
}

const looksLikeModsFolder = computedAsync(async () => {
  const entries = await fromAsync(props.handle.entries())
  const versionLike = entries.some(([name, handle]) => handle.kind === 'directory' && name.match(/^\d+\.\d+\.\d+\.\d+$/))

  return (props.handle.name === 'mods' || props.handle.name === 'res_mods') && versionLike
})

const looksLikeModsVersionFolder = computed(() => {
  return props.handle.name.match(/^\d+\.\d+\.\d+\.\d+$/) !== null
})




</script>


<style lang="scss" scoped>
@use "/src/styles/mixins.scss" as *;

.page {
  width: 600px;
  min-width: 0;
  max-width: 100%;

  @include less-small {
    width: 100%;
  }


  code {
    font-size: 0.9em;
    border-radius: 5px;
    background-color: #1e1e1e;
    border: 1px solid #555;
    padding: 2px 4px;
  }

  .spacer {
    height: 20px;
  }

  .not-a-game {

    .layout {
      display: flex;
      flex-direction: row;

      @include less-small {
        flex-direction: column;
      }
    }

    img {
      max-height: 300px;
      width: auto;
      border-radius: 10px;
      margin-top: 10px;
    }

    .center {
      display: flex;
      justify-content: center;
    }
  }

  .path {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border-radius: 7px;
    color: #888;
    margin-top: 15px;
    background-color: #1e1e1e;
    border: 1px solid #555;
    font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
    text-wrap: nowrap;

    .target {
      font-weight: bold;
      color: #ff9800;
    }

    .current {
      font-weight: bold;
    }
  }
}
</style>