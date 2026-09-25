import type { Classes } from '../../utils/utils'
import type { ValueGenerator } from './generators/valueSource'

type Range = { start: number, end: number }
type MeasuredLabel = { p: number, label: string, key: string, size: number, classes?: Classes, onlyFitted?: boolean }

type PrioritySource = {
  generator: ValueGenerator
  limits: Range
  padding: { clip: number, flow: number }
  compute: (value: number) => MeasuredLabel
}

type Candidate = Omit<MeasuredLabel, 'p'> & {
  value: number
  middle: number
  rank: number
  priorityIndex: number
  padding: PrioritySource['padding']
}

const MAX_VALUES_PER_PRIORITY = 10000
const COLLISION_EPSILON = 1e-6

function rankForKey(key: string) {
  let hash = 2166136261
  for (let index = 0; index < key.length; index++) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619)
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b)
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35)
  return (hash ^ (hash >>> 16)) >>> 0
}

function lowerBound(candidates: Candidate[], value: number) {
  let from = 0
  let to = candidates.length
  while (from < to) {
    const middle = Math.floor((from + to) / 2)
    if (candidates[middle].value < value) from = middle + 1
    else to = middle
  }

  return from
}

export function calculatePriorities(ctx: {
  priorities: readonly PrioritySource[]
  maxLabelSize: number
  bounds: Range
  layoutLimits: Range
  overflowLimits: Range
}) {
  const { priorities, maxLabelSize, bounds, layoutLimits, overflowLimits } = ctx
  const scale = (layoutLimits.end - layoutLimits.start) / (bounds.end - bounds.start)
  if (!Number.isFinite(scale) || scale <= 0) return []

  for (const { padding } of priorities) {
    if (!Number.isFinite(padding.clip) || padding.clip < 0 || !Number.isFinite(padding.flow) || padding.flow < 0) {
      throw new Error('Priority labels require non-negative finite padding')
    }
  }

  const maxClipPadding = Math.max(0, ...priorities.map(priority => priority.padding.clip))
  const maxFlowPadding = Math.max(0, ...priorities.map(priority => priority.padding.flow))
  const radius = (maxLabelSize + maxClipPadding) / scale

  // Keep neighbours for flow as well as every label that can still reach the viewport.
  const renderReach = 2 * maxLabelSize + Math.max(maxClipPadding, maxFlowPadding)
  const toValue = (pixel: number) => bounds.start + (pixel - layoutLimits.start) / scale
  const outputFrom = toValue(overflowLimits.start - renderReach)
  const outputTo = toValue(overflowLimits.end + renderReach)
  let accepted: Candidate[] = []

  const hasConflict = (label: Candidate, others: Candidate[], samePriority: boolean) => {
    const reach = (label.size / 2 + maxLabelSize / 2 + maxClipPadding) / scale
    for (let index = lowerBound(others, label.value - reach); index < others.length; index++) {
      const other = others[index]
      if (other.value > label.value + reach) break
      if (other === label) continue
      if (samePriority && (other.rank < label.rank || (other.rank === label.rank && other.value > label.value))) continue

      // Compare distances in data coordinates: panning must not change the decision.
      const padding = Math.max(label.padding.clip, other.padding.clip)
      if (Math.abs(other.value - label.value) * scale < (other.size + label.size) / 2 + padding - COLLISION_EPSILON) return true
    }
    return false
  }

  for (const [priorityIndex, priority] of priorities.entries()) {
    // One hop reaches same-priority competitors; another reaches their higher-priority blockers.
    // Higher priorities therefore need two extra conflict radii per remaining priority.
    const dependencyReach = 2 * (priorities.length - priorityIndex - 1) * radius
    const selectionFrom = outputFrom - dependencyReach
    const selectionTo = outputTo + dependencyReach
    const from = Math.max(priority.limits.start, selectionFrom - radius)
    const to = Math.min(priority.limits.end, selectionTo + radius)
    if (from > to) continue

    const candidates: Candidate[] = []
    let previous = -Infinity
    let examined = 0
    for (const value of priority.generator(from).forward) {
      if (++examined > MAX_VALUES_PER_PRIORITY) throw new Error('Priority label neighbourhood exceeds 10000 values')
      if (!Number.isFinite(value) || value < previous) throw new Error('Priority label generators must yield finite values in ascending order')
      if (value === previous) continue
      previous = value

      if (value < from) continue
      if (value > to) break

      const { p, ...measured } = priority.compute(value)
      if (!Number.isFinite(measured.size) || measured.size < 0 || measured.size > maxLabelSize) {
        throw new Error(`Priority label exceeds maxLabelSize (${maxLabelSize}): ${measured.label}`)
      }
      if (measured.label === '') continue
      const key = `${priorityIndex}:${measured.key}`
      candidates.push({ ...measured, key, value, middle: p, rank: rankForKey(`${key}:${value}`), priorityIndex, padding: priority.padding })
    }

    const eligible = candidates.filter(label => !hasConflict(label, accepted, false))
    // A losing neighbour still blocks: acceptance within this priority never recurses.
    const selected = eligible.filter(label =>
      label.value >= selectionFrom &&
      label.value <= selectionTo &&
      !hasConflict(label, eligible, true))

    accepted = [...accepted, ...selected].sort((a, b) => a.value - b.value)
  }

  return accepted.filter(label => label.value >= outputFrom && label.value <= outputTo)
}
