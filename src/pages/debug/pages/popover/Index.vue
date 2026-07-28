<template>
  <DebugPage title="Popover"
    description="Позиционирование и флип у краёв viewport, виртуальная цель, автозакрытие, стилизованная карточка."
    source="src/shared/uiKit/popover/">

    <DebugSection title="Слои и с чего начать" id="layers"
      description="Четыре компонента лежат друг на друге. Если что-то сломалось — спускайся вниз по таблице, пока поведение не станет ожидаемым: так видно, какой слой виноват.">

      <table class="debug-table">
        <thead>
          <tr>
            <th>компонент</th>
            <th>что добавляет</th>
            <th>секция</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Popover</th>
            <td>позиция, флип, телепорт, события — но ни стилей, ни анимации, ни закрытия</td>
            <td>
              <a href="#base-placement">placement</a>, <a href="#edge-flip">флип</a>,
              <a href="#scroll-follow">скролл</a>, <a href="#virtual-target">виртуальная цель</a>,
              <a href="#teleport-to">teleportTo</a>, <a href="#outside-window-events">события границ</a>,
              <a href="#pointer-events">указатель</a>
            </td>
          </tr>
          <tr>
            <th>PopoverAnimated</th>
            <td>классы перехода в слот, ожидание первого посчитанного кадра</td>
            <td><a href="#animated">анимация</a></td>
          </tr>
          <tr>
            <th>PopoverStyled</th>
            <td>карточку со стрелкой, offset по умолчанию, interactive</td>
            <td><a href="#styled-card">карточка</a></td>
          </tr>
          <tr>
            <th>PopoverAutoClose</th>
            <td>v-model, Escape, закрытие по указателю и по выходу за границы</td>
            <td><a href="#auto-close">автозакрытие</a></td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        Общее для всей страницы: поповеры телепортируются в <span class="debug-value">#popover-root</span> в конце
        body, то есть наружу дебаг-обвязки. Поэтому классы <span class="debug-value">.debug-*</span> до содержимого
        карточек не достают, и всё внутри них стилизовано локально. Ещё поповеры пересчитывают позицию каждый кадр,
        пока открыты, — открытых карточек лучше не оставлять десятками по всей странице.
      </p>
    </DebugSection>

    <BasePlacement />
    <EdgeFlip />
    <ScrollFollow />
    <VirtualTarget />
    <TeleportTarget />
    <OutsideWindowEvents />
    <AutoCloseModes />
    <StyledCard />
    <AnimatedAppearance />
    <PointerOutsideEvents />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import BasePlacement from './sections/BasePlacement.vue'
import EdgeFlip from './sections/edgeFlip/EdgeFlip.vue'
import ScrollFollow from './sections/ScrollFollow.vue'
import VirtualTarget from './sections/VirtualTarget.vue'
import TeleportTarget from './sections/TeleportTarget.vue'
import OutsideWindowEvents from './sections/OutsideWindowEvents.vue'
import AutoCloseModes from './sections/autoClose/AutoCloseModes.vue'
import StyledCard from './sections/StyledCard.vue'
import AnimatedAppearance from './sections/AnimatedAppearance.vue'
import PointerOutsideEvents from './sections/PointerOutsideEvents.vue'

</script>
