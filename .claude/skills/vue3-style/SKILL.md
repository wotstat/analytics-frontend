---
name: vue3-style
description: Coding conventions for Vue 3 components and composables in the wotstat analytics-frontend repo (Vue 3 script-setup + TS + Vite + Bun). Use whenever writing or editing a .vue SFC, a useXxx.ts composable, a module store.ts, deciding where to put a new file/component/asset, or reviewing Vue code in this project — before generating the first line. Covers SFC structure, props/emits/model/slots, template refs, composables, file colocation / asset locality (keep things next to their use, not global), state (no global store, URL query / useLocalStorage), VueUse usage, and SCSS.
---

# Vue 3 style — wotstat analytics-frontend

Match the surrounding code. When an existing file disagrees with a rule here, follow the file. These are the defaults for new code.

## Non-negotiables (ESLint enforces)

- **Single quotes**, **no semicolons** (`semi: never`). 2-space indent.
- UI text and comments **in Russian**. Code identifiers in English.
- Imports from project root use the `@` alias (`@/db`, `@/shared/...`); siblings use relative paths (`./Foo.vue`, `./utils`).
- Verify with `bun run build` (`vue-tsc && vite build`) — this is the only correctness check; there are no tests.

## SFC skeleton

Block order is always **`<template>` → `<script setup lang="ts">` → `<style scoped lang="scss">`**, separated by a blank line (often two). Never Options API; never `<script setup>` without `lang="ts"`.

```vue
<template>
  <div class="foo" ref="root" :class="{ open: isOpen }">
    <slot name="header" v-if="slots.header" />
    <p>{{ label }}</p>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, useSlots, useTemplateRef } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  title: string
  color: 'orange' | 'green' | 'red' | 'blue'   // union literals, not string+enum
  processor?: (data: number) => string          // optional with ?
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', value: string): void
}>()

const model = defineModel<string>()             // prefer over value-prop + emit
const isOpen = ref(false)
const root = useTemplateRef<HTMLElement>('root') // template ref: string matches ref="root"
const slots = useSlots()

const label = computed(() => props.title.trim())

onClickOutside(root, () => isOpen.value = false)

function select(value: string) {                // handlers are `function`, not const arrow
  model.value = value
  emit('select', value)
  isOpen.value = false
}
</script>


<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.foo {
  color: var(--text-color);   // theme via CSS vars from styles/variables.scss (dark theme only)
}
</style>
```

## `<script setup>` rules

- **Props**: `const props = defineProps<{ ... }>()` — always type-only generics, never the runtime object/`PropType` form. Optional props use `?`. Enum-like props are union string literals. `withDefaults(defineProps<...>(), { ... })` only when a default is actually needed.
- **Emits**: typed call-signature form — `defineEmits<{ (e: 'close'): void }>()`, assigned to `const emit`. (Match existing files; don't switch to the `{ close: [] }` shorthand.)
- **Two-way binding**: use `defineModel<T>()` (28+ files rely on it). Reach for a `value` prop + `update:` emit only when you need custom modifier logic.
- **Template refs**: `const el = useTemplateRef<HTMLElement>('el')` paired with `ref="el"` in the template. Import `useTemplateRef` from `vue`; the string argument must match the `ref="..."` attribute (keep it equal to the variable name). Drop the `| null` — the return type already includes `null`. For component refs pass the instance type: `useTemplateRef<InstanceType<typeof Foo>>('foo')`. **Do not use the old `ref(null)` + matching-variable-name style.**
- **Conditional slots**: `const slots = useSlots()` then `<slot name="x" v-if="slots.x" />`.
- **Generic components**: `<script setup lang="ts" generic="T">` (see `shared/uiKit/dropdown/DropDown.vue`).
- **Functions**: named `function foo() {}` declarations for handlers and helpers; arrow functions only inline (`.map`/`.filter`/`.find`, one-line callbacks). camelCase.
- **Reactivity**: `ref` / `computed` / `watchEffect` / `shallowRef` (use `shallowRef`/`toRaw` for large query result payloads). Import each explicitly from `vue`.

## Composables (`useXxx.ts`)

- File and function both `useXxx`. Accept `MaybeRefOrGetter<T>` for flexible inputs and unwrap with `toValue`. Return an **object of refs** (`{ hasScrollX, hasScrollY }`) or a single `computed`.
- Lean on VueUse instead of hand-rolling: `useResizeObserver`, `useMutationObserver`, `useEventListener`, `useElementVisibility`, `onClickOutside`, `useStorage`/`useLocalStorage`, `useMouse`, etc. It's already a heavy dependency — check there first.
- Clean up in `onUnmounted` / `onDeactivated` when you touch anything global.

## File colocation — asset locality

**Keep every file as close to where it's used as possible.** Default to *local*, promote to *shared* only on real reuse. Don't create global `components/` / `composables/` / `assets` buckets — a component, composable, helper, type, or image lives next to the thing that uses it, nested as deep as needed.

- A feature is a folder. Its private parts nest inside it: a `components/` folder scoped to *that* feature (not a global one), `useXxx.ts` composables sitting right beside the component that calls them, `utils.ts` / `types.ts` / helper `.ts` next to their consumers.
- **Assets are local too.** SVG icons and images live inside the feature that renders them — either a local `assets/` folder or a loose `icon.svg` right next to the component. Never route a one-feature icon through a global asset folder.
- Nest sub-features recursively. Each sub-feature repeats the pattern (its own `components/`, `useXxx.ts`, `assets/`, tooltips, etc.).
- **Promotion rule**: put a file at the *lowest common ancestor* of everything that uses it. Used by one component → beside it. Shared by several sub-features of one feature → a `shared/` folder inside that feature (e.g. `onslaught/shared/`). Genuinely cross-cutting across the whole app → `src/shared/` (uiKit, game domain, query, utils…). Don't skip straight to global.

Canonical example — `src/pages/infographics/pages/onslaught/`:

```
onslaught/
├─ Layout.vue
├─ assets/bg-1.jpg …                    ← images local to the feature
├─ shared/                              ← shared across onslaught sub-features only
│  ├─ Loader.vue  useSeasonInterval.ts
│  └─ settings/nicknameInput/player.svg ← icon sits right by its component
├─ leaderboard/
│  ├─ Leaderboard.vue
│  ├─ assets/triangle-up.svg
│  └─ components/…/detail/intervalSelector/…   ← nested per sub-feature
└─ statistics/
   ├─ Onslaught.vue  types.ts  utils.ts
   ├─ mainStat/{MainStat.vue, useMainStat.ts, items/…, tooltips/…}
   ├─ vehicleTable/{VehicleTable.vue, useVehicleTable.ts}
   └─ secondaryStat/qualification/assets/arrow-right.svg
```

## State & data

- **No Pinia/Vuex, no global store.** Shared module state is a plain module-level `ref` or `useLocalStorage(...)` exported from a `store.ts` next to the feature (see `pages/services/bob25/store.ts`, `shared/global/`).
- **Page/UI state lives in the URL query** via `useQueryStatParams` / `useQueryParamStorage`, or in `useLocalStorage` for preferences.
- **Variant lists** are `as const` arrays of `{ value, label }`; derive the type with `typeof variants[number]['value']`.
- **ClickHouse data**: use the `queryComputed` / `queryComputedFirst` / `queryAsyncFirst` helpers from `@/db` with a `settings` (cache) and `enabled` option. Gate heavy queries on visibility: `const enabled = useElementVisibility(container)` → pass `{ enabled }`. Render via the loading-status widgets (`GenericInfo` etc.), not ad-hoc spinners.

## Styles

- `<style scoped lang="scss">`; `@use '@/styles/mixins.scss' as *` for mixins.
- Colors/spacing come from CSS variables in `styles/variables.scss` (`var(--text-color)`, `var(--blue-color)`, …). Dark theme is the only theme.
- SCSS nesting with `&`, `&.open`, `&:hover`, `:deep(...)` for child components / transitions.

## Assets

- SVGs import as Vue components (`import ArrowDown from './arrow-down.svg'`) via vite-svg-loader; style with `fill: currentColor`.
- Markdown files import as components (`import { VueComponent } from './index.md'`).

## Don't

- No Options API, no `defineComponent`, no `.vue` without `lang="ts"`.
- No semicolons, no double quotes.
- No old-style template refs (`const el = ref(null)` bound by variable name) — use `useTemplateRef('el')`. No `reactive({})` for component-local state (use `ref`).
- No new global state library — module singleton or URL/localStorage instead.
- Don't dump feature-specific components/composables/assets into global buckets — colocate next to use, promote only on real reuse.
- Don't add English UI copy — Russian only.
