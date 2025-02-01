import { TweenOptions, useTweenComputed } from "../tween/useTweenRef";
import { useRoundProcessor } from "./useRoundProcessor";

export function useRoundTweenProcessor(effect: () => number, options?: TweenOptions) {
  return useRoundProcessor(useTweenComputed(effect, options));
}