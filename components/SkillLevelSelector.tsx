import React from 'react';
import { SkillLevel } from '../types';

interface SkillLevelSelectorProps {
  skillLevel: SkillLevel;
  onSkillLevelChange: (level: SkillLevel) => void;
}

const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

const SkillLevelSelector: React.FC<SkillLevelSelectorProps> = ({ skillLevel, onSkillLevelChange }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-bold text-muted">Skill Level:</label>
      <div className="bg-surface-2 p-1 rounded-full flex border border-border">
        {SKILL_LEVELS.map(level => (
          <button
            key={level}
            onClick={() => onSkillLevelChange(level)}
            className={`px-3 py-0.5 text-xs font-bold rounded-full transition-colors ${
              skillLevel === level
                ? 'bg-primary text-white'
                : 'text-muted hover:bg-surface-1'
            }`}
            aria-pressed={skillLevel === level}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SkillLevelSelector;
