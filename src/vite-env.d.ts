/// <reference types="vite/client" />
/// <reference types="yandex-metrika-tag" />
/// <reference types="wicg-file-system-access" />


interface ImportMetaEnv {
  readonly VITE_META_RENDERER: boolean;
  readonly VITE_META_SERVER: boolean
  VITE_MODE_DEV_LOCAL?: string;
  VITE_DEFAULT_URL_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'virtual:meta-definitions' {
  import type { MetaDefinition } from '@/meta/utils'
  const definitions: MetaDefinition[]
  export default definitions
}

declare module '*.svg?component' {
  import type { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}

declare module '*.md' {
  // "unknown" would be more detailed depends on how you structure frontmatter
  const attributes: Record<string, unknown>

  // When "Mode.TOC" is requested
  const toc: { level: string, content: string }[]

  // When "Mode.HTML" is requested
  const html: string

  // When "Mode.RAW" is requested
  const raw: string

  // When "Mode.React" is requested. VFC could take a generic like React.VFC<{ MyComponent: TypeOfMyComponent }>
  import React from 'react'
  const ReactComponent: React.VFC

  // When "Mode.Vue" is requested
  import { ComponentOptions, Component } from 'vue'
  const VueComponent: ComponentOptions
  const VueComponentWith: (components: Record<string, Component>) => ComponentOptions

  // Modify below per your usage
  export { attributes, toc, html, ReactComponent, VueComponent, VueComponentWith }
}
