<template>
  <DebugPage title="Контекстное меню" description="Строки меню, вложенные подменю, чекмарки, программное открытие."
    source="src/shared/uiKit/contextMenu/">

    <DebugSection title="Устройство и с чего начать" id="layers"
      description="Меню — не компонент, а функция: вызвал — открылось. Если что-то ведёт себя странно, сначала определи, чей это слой: сборка списка строк, глобальное состояние или панель, которая его рисует.">

      <table class="debug-table">
        <thead>
          <tr>
            <th>файл</th>
            <th>за что отвечает</th>
            <th>секция</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>createContextMenu.ts</th>
            <td>типы строк, глобальный <span class="debug-value">currentContextMenu</span>,
              <span class="debug-value">closeContextMenu</span> / <span class="debug-value">isContextMenuOpen</span>
            </td>
            <td><a href="#creation">способы создания</a>, <a href="#opening">открытие</a></td>
          </tr>
          <tr>
            <th>simpleContextMenu.ts</th>
            <td>хелперы и билдер поверх raw-типов: button, header, separator, checkboxItem, childs, options,
              childOptions, childButtons</td>
            <td><a href="#creation">способы создания</a>, <a href="#checkmarks">чекмарки</a></td>
          </tr>
          <tr>
            <th>composition.ts</th>
            <td><span class="debug-value">useCheckbox</span> — и это всё содержимое файла</td>
            <td><a href="#checkmarks">чекмарки</a></td>
          </tr>
          <tr>
            <th>ContextMenuRoot.vue</th>
            <td>телепорт в body, закрытие по Escape и клику мимо, задержки, press-drag-release</td>
            <td><a href="#events">лог событий</a></td>
          </tr>
          <tr>
            <th>ContextMenuPanel.vue + lines/</th>
            <td>отрисовка строк, позиционирование, флип подменю, задержки раскрытия</td>
            <td><a href="#line-types">типы строк</a>, <a href="#nested">подменю</a>,
              <a href="#edge-cases">крайние случаи</a></td>
          </tr>
        </tbody>
      </table>

      <p class="debug-note">
        Проектной обёртки над меню нет: в <span class="debug-value">src/shared/ui/</span> контекстных меню нет,
        страницы вызывают базовый слой напрямую. Единственное боевое использование —
        <span class="debug-path">src/pages/install/components/cardIntaractionControl.ts</span> (меню-настройки с
        чекбоксами и тогглом по кнопке); на него ссылаются секции «открытие» и «чекмарки».
      </p>

      <p class="debug-note">
        <span class="debug-value">ContextMenuRoot</span> уже смонтирован в App.vue — страницам монтировать его не
        нужно, достаточно вызвать функцию. Меню телепортируется в <span class="debug-value">#context-menu-root</span> в
        конце body, наружу <span class="debug-value">.debug-root</span>, поэтому классы
        <span class="debug-value">.debug-*</span> внутрь панели не достают. Открытое меню всегда одно на всё
        приложение.
      </p>

      <p class="debug-note">
        <b>Пальцем.</b> Правого клика на тач-устройстве нет: меню вызывается системным долгим тапом (браузер присылает
        <span class="debug-value">contextmenu</span>) — в секциях такие места отмечены отдельно. Наведения тоже нет,
        поэтому подменю раскрывается тапом, а логика с задержками и лучом от курсора на тач-экране не участвует вовсе.
      </p>
    </DebugSection>

    <Creation />
    <LineTypes />
    <Nested />
    <Checkmarks />
    <Opening />
    <Events />
    <EdgeCases />
  </DebugPage>
</template>


<script setup lang="ts">
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Creation from './sections/Creation.vue'
import LineTypes from './sections/LineTypes.vue'
import Nested from './sections/Nested.vue'
import Checkmarks from './sections/Checkmarks.vue'
import Opening from './sections/Opening.vue'
import Events from './sections/Events.vue'
import EdgeCases from './sections/EdgeCases.vue'

</script>
