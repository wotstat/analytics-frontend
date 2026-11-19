<template>
  <DefineMenu v-slot="{ mobile = false }">
    <nav class="section-menu" :class="{ flat: sections.length === 1 }">
      <div v-for="section in sections" :key="section.id">
        <button v-if="section.title" type="button" class="section-toggle" @click="toggleSection(section.id, mobile)">
          <DropdownArrow horizontal :expanded="isSectionOpen(section.id, mobile)" />
          {{ section.title }}
        </button>

        <div class="disclosure" :class="{ open: !section.title || isSectionOpen(section.id, mobile) }">
          <div class="disclosure-body">
            <div class="links" :class="{ nested: section.title }">
              <RouterLink v-for="link in section.links" :key="link.to" :to="link.to" @click.exact="menuOpen = false">
                <slot name="link-label" :link>{{ link.label }}</slot>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </DefineMenu>

  <SidebarLayout wide-sidebar>
    <template #sidebar>
      <SectionMenu class="sticky-sidebar nice-scrollbar" />
    </template>

    <template #content-top>
      <h1 class="heading">{{ title }}</h1>
    </template>

    <template #mobile-content-top>
      <div class="mobile-menu">
        <h1 class="heading">
          <button type="button" class="menu-toggle" @click="menuOpen = !menuOpen">
            {{ title }}
            <span class="indicator">
              <DropdownArrow angle="large" :expanded="menuOpen" />
            </span>
          </button>
        </h1>

        <div class="disclosure" :class="{ open: menuOpen }">
          <div class="disclosure-body">
            <SectionMenu mobile />
          </div>
        </div>
      </div>
    </template>

    <slot />
  </SidebarLayout>
</template>

<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core'
import { reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import SidebarLayout from './SidebarLayout.vue'

type SectionLink = { to: string, label: string }

defineProps<{
  title: string
  sections: { id: string, title?: string, links: SectionLink[] }[]
}>()

defineSlots<{
  default: () => unknown
  'link-label'?: (props: { link: SectionLink }) => unknown
}>()

const [DefineMenu, SectionMenu] = createReusableTemplate<{ mobile?: boolean }>({
  props: { mobile: Boolean },
})
const collapsedOnDesktop = reactive(new Set<string>())
const expandedOnMobile = ref<string>()
const menuOpen = ref(false)
const route = useRoute()

watch(() => route.path, () => menuOpen.value = false)

function isSectionOpen(id: string, mobile: boolean) {
  return mobile ? expandedOnMobile.value === id : !collapsedOnDesktop.has(id)
}

function toggleSection(id: string, mobile: boolean) {
  if (mobile) {
    expandedOnMobile.value = expandedOnMobile.value === id ? undefined : id
    return
  }

  if (collapsedOnDesktop.has(id)) collapsedOnDesktop.delete(id)
  else collapsedOnDesktop.add(id)
}
</script>

<style scoped lang="scss">
@use '/src/styles/mixins.scss' as *;

.heading {
  margin: 0;
}

.disclosure {
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: grid-template-rows 200ms ease, opacity 160ms ease, visibility 200ms;

  &.open {
    grid-template-rows: 1fr;
    visibility: inherit;
    opacity: 1;
    pointer-events: inherit;
  }

  >.disclosure-body {
    min-height: 0;
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.section-menu {
  display: grid;
  gap: 16px;
  font-size: 0.9375rem;
  line-height: 1.2rem;

  .section-toggle,
  a {
    padding: 6.5px 8px;
    border-radius: 10px;
    color: inherit;

    @media (hover: hover) {
      &:hover {
        background-color: #ffffff14;
      }
    }
  }

  .section-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    font: inherit;
    font-weight: 600;
    text-align: left;

    .dropdown-arrow {
      width: 10px;
      height: 10px;
      color: #ffffff80;
    }
  }

  .links {
    display: grid;

    &.nested {
      margin: 2px 0 0 12px;
      border-left: 1px solid #ffffff26;
      padding-left: 6px;
      color: #b7babd;

      @media (hover: hover) {
        a:hover {
          color: var(--font-color);
        }
      }
    }

    .router-link-exact-active {
      background-color: #ffffff14;
    }
  }
}

.sticky-sidebar {
  max-height: calc(100dvh - var(--sidebar-sticky-top) - 1rem);
  overflow-y: auto;
}

.mobile-menu {
  margin-bottom: 15px;

  .heading {
    font-size: clamp(1.25rem, 6vw, 1.625rem);
  }

  .menu-toggle {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    font: inherit;
    text-align: left;
  }

  .indicator {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    aspect-ratio: 1;
    border-radius: 9px;
    background: #ffffff14;
    font-size: 16px;
  }

  .section-menu {
    gap: 4px;
    margin-block: 4px 6px;

    @include small {
      &.flat .links {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
      }
    }
  }
}
</style>
