import { defineAsyncComponent, defineComponent, h, type AsyncComponentLoader } from 'vue'
import { registerAsyncPage, useAsyncPageMounted } from '@/shared/uiKit/pageNavigation/pageNavigation'
import PageLoader from '@/shared/ui/loaders/pageLoader/PageLoader.vue'

export function asyncPage(loader: AsyncComponentLoader) {
  const component = defineAsyncComponent({
    loader: async () => {
      const loaded = await loader()
      const page = loaded.default ?? loaded

      return defineComponent({
        name: 'AsyncPageContent',
        inheritAttrs: false,
        setup: (_props, { attrs, slots }) => {
          useAsyncPageMounted(component)
          return () => h(page, attrs, slots)
        },
      })
    },
    loadingComponent: PageLoader,
    delay: 200,
    suspensible: true,
  })

  registerAsyncPage(component)
  return component
}
