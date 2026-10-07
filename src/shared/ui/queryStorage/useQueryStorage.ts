import { computed, inject, onActivated, onDeactivated, onMounted, onScopeDispose, toValue, watch } from 'vue'
import { matchedRouteKey, useRouter } from 'vue-router'
import { setupQueryStorage, type QueryOwner } from './queryStorageCoordinator'
import type { QueryParams, QueryStorage, QueryStorageOptions } from './queryStorageTypes'

export { defineParams } from './queryStorageTypes'
export type { QueryParam, QueryParams, QueryStorage, QueryValues, QueryWriteOptions, QueryStorageOptions } from './queryStorageTypes'
export { setupQueryStorage, queryStorageSync } from './queryStorageCoordinator'

export function useQueryStorage<P extends QueryParams>(definitions: P, options: QueryStorageOptions = {}): QueryStorage<P> {
  const coordinator = setupQueryStorage(useRouter())
  const owner: QueryOwner = {
    record: inject(matchedRouteKey, undefined)?.value, active: true, bindings: [],
    enabled: () => toValue(options.enabled) ?? true
  }

  const bindings = Object.fromEntries(Object.entries(definitions).map(([name, definition]) => [
    name, coordinator.bind(owner, name, definition, options)
  ]))

  const params = Object.fromEntries(Object.entries(bindings).map(([name, binding]) => [name, computed({
    get: () => binding.entry.value.value,
    set: value => coordinator.set(binding, value)
  })])) as unknown as QueryStorage<P>['params']

  onMounted(() => coordinator.activate(owner))
  onActivated(() => coordinator.activate(owner))
  onDeactivated(() => coordinator.deactivate(owner))
  onScopeDispose(() => coordinator.deactivate(owner, true))
  watch(owner.enabled, () => {
    if (owner.active) coordinator.activate(owner)
  })

  return {
    params,
    patch: (values, overrides = {}) => coordinator.patch(
      Object.entries(values).map(([name, value]) => ({ binding: bindings[name], value })), overrides
    ),
    flush: key => coordinator.flush(key === undefined ? Object.values(bindings) : [bindings[key as string]])
  }
}
