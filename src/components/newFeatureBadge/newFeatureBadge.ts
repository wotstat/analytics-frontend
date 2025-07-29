import { useLocalStorage } from "@vueuse/core";
import { computed, Ref, watch } from "vue";
import { Directive } from 'vue';

const features = [
  'mod-installer'
] as const;

type Features = typeof features[number];

const visitedFeatures = useLocalStorage('visited-features', new Map<string, boolean>());

export function setFeatureVisit(feature: Features, visited: boolean = true): void {
  if (visitedFeatures.value.get(feature) === visited) return
  visitedFeatures.value.set(feature, visited);
}

export function featureState(feature: Features): Ref<boolean> {
  return computed(() => {
    const visited = visitedFeatures.value.get(feature);
    return visited !== undefined ? visited : false;
  });
}

export function clearAllFeatureVisits(): void {
  visitedFeatures.value.clear();
}

export const vNewFeatureBadge: Directive<HTMLElement, Features> = {
  mounted(el, binding) {
    watch(featureState(binding.value), (newValue) => {
      if (newValue) el.classList.remove('new-feature-badge');
      else el.classList.add('new-feature-badge');
    }, { immediate: true });

    if (binding.modifiers.hover) {
      el.addEventListener('mouseover', () => {
        console.log('hover', binding.value);
        setFeatureVisit(binding.value)
      });
    }

    if (binding.modifiers.click) {
      el.addEventListener('click', () => setFeatureVisit(binding.value));
    }
  },
};