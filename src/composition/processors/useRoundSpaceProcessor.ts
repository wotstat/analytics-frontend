import { WatchSource } from "vue";
import { useRoundProcessor } from "./useRoundProcessor";
import { useSpaceProcessor } from "./useSpaceProcessor";

export function useRoundSpaceProcessor(value: WatchSource<number>) {
  return useSpaceProcessor(useRoundProcessor(value))
}