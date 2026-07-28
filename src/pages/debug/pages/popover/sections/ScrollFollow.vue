<template>
  <DebugSection title="Скролл: поповер приклеен к цели" id="scroll-follow"
    description="Позиция пересчитывается каждый кадр, поэтому карточка должна ехать за целью и при прокрутке контейнера, и при прокрутке всей страницы — без отставания на кадр и без рывков."
    source="src/shared/uiKit/popover/Popover.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">поповер в контейнере</span>
        <input type="checkbox" v-model="innerDisplay">
      </label>

      <label class="debug-control">
        <span class="debug-label">поповер на странице</span>
        <input type="checkbox" v-model="pageDisplay">
      </label>

      <PlacementSelect v-model="placement" label="placement" />
    </div>

    <p class="debug-hint">Прокручиваемая сцена: контейнер скроллится по обеим осям.</p>

    <div class="debug-stage scroll">
      <div class="scroll-content">
        <button class="debug-btn" ref="innerTarget" @click="innerDisplay = !innerDisplay">цель в контейнере</button>
      </div>
    </div>

    <p class="debug-hint">Обычная сцена: тут проверяем прокрутку всей страницы.</p>

    <div class="debug-stage center short">
      <button class="debug-btn" ref="pageTarget" @click="pageDisplay = !pageDisplay">цель на странице</button>
    </div>

    <PopoverStyled :target="innerTarget" :display="innerDisplay" :placement="placement ?? 'right-float'"
      :arrow-size="6">
      <div class="card-body">
        <div>цель внутри прокручиваемого контейнера</div>
        <div class="hint">крути контейнер — карточка едет за кнопкой</div>
      </div>
    </PopoverStyled>

    <PopoverStyled :target="pageTarget" :display="pageDisplay" :placement="placement ?? 'right-float'" :arrow-size="6">
      <div class="card-body">
        <div>цель на странице</div>
        <div class="hint">крути страницу — карточка едет за кнопкой</div>
      </div>
    </PopoverStyled>

    <p class="debug-note">
      Известное ограничение: поповер знает только про viewport, а про клиппинг родителя — нет. Прокрути контейнер так,
      чтобы кнопка уехала под его край: кнопка обрезана, а карточка продолжает висеть на своём месте. Задать
      «границу-родителя» компонент не умеет — если такое поведение нужно, его нужно закрывать самому (например по
      IntersectionObserver на цели).
    </p>

    <p class="debug-note">
      Пальцем: инерционный скролл на iOS — самое злое место. Карточка не должна отставать от цели во время «доезда»,
      а при скролле страницы жестом с края экрана не должна оставаться висеть в старой точке. Ещё проверь скролл
      страницы, когда карточка открыта у нижнего края: адресная строка сворачивается, вьюпорт меняет высоту, и
      карточка должна переехать.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PopoverStyled from '@/shared/uiKit/popover/PopoverStyled.vue'
import { PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import PlacementSelect from '../shared/PlacementSelect.vue'

const innerTarget = useTemplateRef<HTMLElement>('innerTarget')
const pageTarget = useTemplateRef<HTMLElement>('pageTarget')

const innerDisplay = ref(false)
const pageDisplay = ref(false)
const placement = ref<PlacementWithModifiers | null>('right-float')

</script>


<style scoped lang="scss">
.scroll-content {
  min-height: 700px;
  min-width: 900px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-body {
  padding: 0.5em 0.7em;
  font-size: 13px;
  line-height: 1.4;
  max-width: 240px;

  .hint {
    font-size: 11px;
    color: #ffffff80;
  }
}
</style>
