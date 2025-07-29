import { shallowRef, triggerRef } from "vue";


export type FocusEffectTarget = {
  id: number;
  element: HTMLElement;
  options: {
  }
}

export const activeShowEffects = shallowRef(new Set<FocusEffectTarget>());


let effectId = 0;
export function showFocusEffect(element: HTMLElement): void {

  const effect: FocusEffectTarget = {
    id: effectId++,
    element,
    options: {}
  }
  activeShowEffects.value.add(effect)

  setTimeout(() => {
    activeShowEffects.value.delete(effect);
    triggerRef(activeShowEffects)
  }, 1000);

  triggerRef(activeShowEffects)

}