<template>
  <div class="page">
    <h1>Установка модов WotStat</h1>
    <p>Вы можете установить моды прямо через браузерный веб-установщик или скачать моды и установить их вручную.</p>

    <div class="select-folder" v-if="isBrowserSupported">
      <h3>Предоставьте доступ к папке с игрой</h3>
      <p>Необходимо выбрать папку в которую установленна игра</p>
      <button @click="selectFolder">Выбрать</button>
    </div>

    <div class="select-folder-unsupported" v-else>
      <h3>Ваш браузер не поддерживается</h3>
      <p>Попробуйте Chrome 86+, Edge 86+, Opera 72+. Firefox и Safari пока не поддерживаются</p>
    </div>

    <div class="game-info" v-if="gameInfo">{{ gameInfo }}</div>

    <button @click="install">Установить</button>
  </div>

</template>


<script setup lang="ts">
import { useInstaller } from './installer';


const { isBrowserSupported, requestGameFolderAccess, gameInfo, installMods } = useInstaller()

async function selectFolder() {
  await requestGameFolderAccess()
}

async function install() {
  installMods()
}

</script>


<style lang="scss" scoped>
.page {
  max-width: 1200px;
  margin: auto;
}
</style>