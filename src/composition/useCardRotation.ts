import { MaybeElementRef, useMouseInElement } from "@vueuse/core";
import { computed, MaybeRefOrGetter, onMounted, onUnmounted, Ref, ref, toValue, watch } from "vue";


export function useCardRotation(target: MaybeElementRef, options: {
  transitionDuration?: number;
  enabled?: MaybeRefOrGetter<boolean>;
}) {

  let animationHandle: ReturnType<typeof requestAnimationFrame> | null = null;

  const { elementX, elementY, elementWidth, elementHeight, isOutside } = useMouseInElement(target)

  const x = computed(() => (elementX.value / elementWidth.value - 0.5) * 2);
  const y = computed(() => (elementY.value / elementHeight.value - 0.5) * 2);

  const enabled = ref(true);
  const targetX = computed(() => enabled.value ? 0 : x.value);
  const targetY = computed(() => enabled.value ? 0 : y.value);

  const animX = ref(0);
  const animY = ref(0);

  const isAnimated = ref(false);
  const isEnabled = computed(() => toValue(options.enabled) ?? true);

  const resultX = computed(() => !isEnabled.value ? 0 : isAnimated.value ? animX.value : targetX.value);
  const resultY = computed(() => !isEnabled.value ? 0 : isAnimated.value ? animY.value : targetY.value);


  let animationStartTime = 0;

  watch(isOutside, (outside) => {
    if (!isEnabled.value) return;

    animationStartTime = performance.now();

    if (!isAnimated.value) {
      animX.value = resultX.value;
      animY.value = resultY.value;
      isAnimated.value = true;
    }

    enabled.value = outside;

    animationLoop();
  })

  const duration = options.transitionDuration ?? 200

  function animationLoop() {
    animationHandle = null;

    const delta = performance.now() - animationStartTime;
    if (delta > duration) {
      isAnimated.value = false;
      return
    }

    const progress = Math.min(delta / duration, 1);
    const xDelta = targetX.value - animX.value;
    const yDelta = targetY.value - animY.value;

    if (Math.abs(xDelta) < 0.01 && Math.abs(yDelta) < 0.01) {
      isAnimated.value = false;
      return;
    }

    animX.value = animX.value + xDelta * progress;
    animY.value = animY.value + yDelta * progress;

    animationHandle = requestAnimationFrame(animationLoop);
  }

  const aspect = computed(() => isEnabled.value ? elementWidth.value / elementHeight.value : 0)


  onMounted(() => {
    if (!isEnabled.value) return;
    animationLoop()
  })

  onUnmounted(() => {
    if (animationHandle) {
      cancelAnimationFrame(animationHandle);
      animationHandle = null;
    }
  })

  return {
    x: resultX,
    y: resultY,
    aspect
  }
}