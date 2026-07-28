<template>
  <DebugPage title="Модальные окна" description="Модальное окно, его содержимое и кнопки, блокировка скролла страницы." source="src/shared/ui/modalWindow/">
    <BaseWindow />
    <Buttons />
    <ScrollLock />
    <CloseMethods />
    <ContentVariants />
    <NestedWindows />
    <NarrowScreen />
    <LegacyPopupWindow />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import BaseWindow from './sections/BaseWindow.vue'
import Buttons from './sections/Buttons.vue'
import ScrollLock from './sections/ScrollLock.vue'
import CloseMethods from './sections/CloseMethods.vue'
import ContentVariants from './sections/ContentVariants.vue'
import NestedWindows from './sections/NestedWindows.vue'
import NarrowScreen from './sections/NarrowScreen.vue'
import LegacyPopupWindow from './sections/LegacyPopupWindow.vue'
</script>
