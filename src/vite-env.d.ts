/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />


interface ImportMetaEnv {
  readonly VITE_SHOW_DEV_WATERMARK: string
  readonly VITE_CLICKHOUSE_URL: string
  readonly VITE_CLICKHOUSE_USER: string
  readonly VITE_CLICKHOUSE_DATABASE: string
  readonly VITE_DISCORD_URL: string
  readonly VITE_WIDGETS_URL: string
  readonly VITE_STATIC_URL: string
  readonly VITE_ANALYTICS_REALTIME_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.md' {
  // "unknown" would be more detailed depends on how you structure frontmatter
  const attributes: Record<string, unknown>;

  // When "Mode.TOC" is requested
  const toc: { level: string, content: string }[];

  // When "Mode.HTML" is requested
  const html: string;

  // When "Mode.RAW" is requested
  const raw: string

  // When "Mode.React" is requested. VFC could take a generic like React.VFC<{ MyComponent: TypeOfMyComponent }>
  import React from 'react'
  const ReactComponent: React.VFC;

  // When "Mode.Vue" is requested
  import { ComponentOptions, Component } from 'vue';
  const VueComponent: ComponentOptions;
  const VueComponentWith: (components: Record<string, Component>) => ComponentOptions;

  // Modify below per your usage
  export { attributes, toc, html, ReactComponent, VueComponent, VueComponentWith };
}