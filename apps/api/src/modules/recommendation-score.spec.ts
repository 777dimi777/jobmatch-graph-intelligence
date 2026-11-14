import { calculateMatch } from './recommendation-score';
describe('calculateMatch', () => {
  const requirements = [{ skillId: 'react', weight: 3, mandatory: true, minLevel: 3 }, { skillId: 'docker', weight: 1, mandatory: false, minLevel: 2 }];
  it('returns 100 when every requirement is met', () => expect(calculateMatch(requirements, [{ skillId: 'react', level: 4 }, { skillId: 'docker', level: 2 }])).toMatchObject({ score: 100, missingMandatory: 0 }));
  it('marks unmet mandatory requirements', () => expect(calculateMatch(requirements, [{ skillId: 'docker', level: 5 }])).toMatchObject({ score: 25, missingMandatory: 1, missingSkillIds: ['react'] }));
  it('handles jobs with no requirements without division by zero', () => expect(calculateMatch([], [])).toMatchObject({ score: 0, totalWeight: 0 }));
});
