export type Requirement = { weight: number; mandatory: boolean; minLevel: number; skillId: string };
export type OwnedSkill = { skillId: string; level: number };
export function calculateMatch(requirements: Requirement[], skills: OwnedSkill[]) {
  const bySkill = new Map(skills.map((skill) => [skill.skillId, skill]));
  const totalWeight = requirements.reduce((sum, requirement) => sum + requirement.weight, 0);
  const matched = requirements.filter((requirement) => (bySkill.get(requirement.skillId)?.level ?? 0) >= requirement.minLevel);
  const matchedWeight = matched.reduce((sum, requirement) => sum + requirement.weight, 0);
  const missing = requirements.filter((requirement) => !matched.includes(requirement));
  return { score: totalWeight === 0 ? 0 : Math.round((matchedWeight / totalWeight) * 1000) / 10, matchedWeight, totalWeight, missingMandatory: missing.filter((requirement) => requirement.mandatory).length, missingSkillIds: missing.map((requirement) => requirement.skillId) };
}
