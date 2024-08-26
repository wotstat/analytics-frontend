import { Component } from "vue"

export const allMdComponents = Object.entries(import.meta.glob('./*.vue', { eager: true }))
  .reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key.replace('./', '').replace('.vue', '')]: (value as any).default
    }
  }, {}) as Record<string, Component>