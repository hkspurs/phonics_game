import { describe, it, expect } from 'vitest';
import { 
  mathCurriculum, 
  getUnitForSkill, 
  isUnitUnlocked, 
  getUnlockedSkills,
  SKILL_IDS 
} from './mathCurriculum.js';

describe('mathCurriculum', () => {
  it('has valid curriculum structure', () => {
    expect(mathCurriculum.length).toBeGreaterThan(0);
    expect(mathCurriculum[0].id).toBe('numbers-1-20');
    expect(mathCurriculum[0].unlockRequirement).toBeNull();
  });

  it('getUnitForSkill returns correct unit', () => {
    const unit = getUnitForSkill(SKILL_IDS.NUMBER_COUNTING);
    expect(unit).toBeDefined();
    expect(unit.id).toBe('numbers-1-20');
    
    const notFound = getUnitForSkill('non_existent_skill');
    expect(notFound).toBeNull();
  });

  it('isUnitUnlocked returns true if no requirement', () => {
    const unit = mathCurriculum[0];
    expect(isUnitUnlocked(unit, () => 'locked')).toBe(true);
  });

  it('isUnitUnlocked returns true only if all requirements mastered', () => {
    const unit = mathCurriculum.find(u => u.id === 'number-bonds');
    
    // Both counting and ordering mastered
    const getStatusAllMastered = (id) => 'mastered';
    expect(isUnitUnlocked(unit, getStatusAllMastered)).toBe(true);
    
    // Only counting mastered
    const getStatusOneMastered = (id) => id === SKILL_IDS.NUMBER_COUNTING ? 'mastered' : 'unlocked';
    expect(isUnitUnlocked(unit, getStatusOneMastered)).toBe(false);
  });

  it('getUnlockedSkills returns skills from all unlocked units', () => {
    // If only first unit is unlocked (no skills mastered)
    const getStatusNoneMastered = () => 'locked';
    const unlocked1 = getUnlockedSkills(getStatusNoneMastered);
    expect(unlocked1).toContain(SKILL_IDS.NUMBER_COUNTING);
    expect(unlocked1).not.toContain(SKILL_IDS.NUMBER_BONDS);
    
    // If counting is mastered, ordinal and patterns unlock
    const getStatusCountingMastered = (id) => id === SKILL_IDS.NUMBER_COUNTING ? 'mastered' : 'unlocked';
    const unlocked2 = getUnlockedSkills(getStatusCountingMastered);
    expect(unlocked2).toContain(SKILL_IDS.NUMBER_COUNTING);
    expect(unlocked2).toContain(SKILL_IDS.ORDINAL_POSITION);
    expect(unlocked2).toContain(SKILL_IDS.SHAPE_PATTERN);
    expect(unlocked2).not.toContain(SKILL_IDS.NUMBER_BONDS); // requires ordering too
  });
});
