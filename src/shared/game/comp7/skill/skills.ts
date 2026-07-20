export const COMP7_SKILL_TAGS = [
  'comp7_aggressive_detection',
  'comp7_ally_support',
  'comp7_aoe_heal',
  'comp7_aoe_inspire',
  'comp7_berserk',
  'comp7_concentration',
  'comp7_fast_recharge',
  'comp7_hunter',
  'comp7_juggernaut',
  'comp7_march',
  'comp7_recon',
  'comp7_redline',
  'comp7_risky_attack',
  'comp7_sniper',
  'comp7_sure_shot',
] as const

export type Comp7SkillTag = typeof COMP7_SKILL_TAGS[number]

const technicalSkillNames = Object.fromEntries(COMP7_SKILL_TAGS.map(tag => [tag, tag])) as Record<string, string>

export function getComp7SkillName(tag: string) {
  return technicalSkillNames[tag] ?? tag
}
