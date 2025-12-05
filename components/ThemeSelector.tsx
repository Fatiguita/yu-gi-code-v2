import React from 'react';
import { Theme } from '../types';
import { themes } from '../styles/themes';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  cardTheme: 'default' | 'official';
  onCardThemeChange: (theme: 'default' | 'official') => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange, cardTheme, onCardThemeChange }) => {
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = themes.find(t => t.name === e.target.value) || themes[0];
    onThemeChange(selectedTheme);
  };

  const handleCardThemeToggle = () => {
    onCardThemeChange(cardTheme === 'default' ? 'official' : 'default');
  };

  return (
    <div className="flex items-center gap-4">
      {/* UI Theme Dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="theme-select" className="text-xs font-bold text-muted">UI Theme:</label>
        <select
          id="theme-select"
          value={currentTheme.name}
          onChange={handleThemeChange}
          className="bg-surface-2 text-main text-xs rounded-md p-1 border border-border focus:ring-accent focus:border-accent"
        >
          {themes.map(theme => (
            <option key={theme.name} value={theme.name}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>

      {/* Card Theme Toggle */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-muted">Card Style:</label>
        <button
          onClick={handleCardThemeToggle}
          className="relative inline-flex items-center h-6 rounded-full w-28 bg-surface-2 border border-border"
        >
          <span className="sr-only">Toggle Card Theme</span>
          <span className={`absolute left-0 inline-block w-14 h-full transform transition-transform rounded-full bg-primary`}
             style={{ transform: cardTheme === 'official' ? 'translateX(100%)' : 'translateX(0)' }}
           />
          <span className={`relative w-1/2 text-center text-xs font-bold z-10 transition-colors ${cardTheme === 'default' ? 'text-white' : 'text-muted'}`}>Default</span>
          <span className={`relative w-1/2 text-center text-xs font-bold z-10 transition-colors ${cardTheme === 'official' ? 'text-white' : 'text-muted'}`}>Official</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector;
