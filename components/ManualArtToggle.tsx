
import React from 'react';

interface ManualArtToggleProps {
  isManual: boolean;
  onToggle: (isManual: boolean) => void;
}

const ManualArtToggle: React.FC<ManualArtToggleProps> = ({ isManual, onToggle }) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="manual-art-toggle" className="text-xs font-bold text-muted whitespace-nowrap">
        Manual Art:
      </label>
      <button
        id="manual-art-toggle"
        onClick={() => onToggle(!isManual)}
        className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors duration-300 ${
          isManual ? 'bg-success' : 'bg-surface-2'
        } border border-border`}
        role="switch"
        aria-checked={isManual}
      >
        <span className="sr-only">Toggle Manual Art Mode</span>
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
            isManual ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default ManualArtToggle;
