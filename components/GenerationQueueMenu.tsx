import React from 'react';
import { CoderCard } from '../types';

const GenerationQueueMenu: React.FC<{
  queue: CoderCard[];
  progress: string | null;
  isGenerating: boolean;
}> = ({ queue, progress, isGenerating }) => {
  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-surface-1 border border-border rounded-lg shadow-2xl z-30 p-4 text-left">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-accent">Generation Queue</h3>
        {isGenerating && (
            <svg
                className="animate-spin h-5 w-5 text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        )}
      </div>
      
      {isGenerating && progress && (
        <div className="mb-2">
          <p className="text-sm text-main font-semibold">{progress}</p>
        </div>
      )}

      {!isGenerating && queue.length === 0 && (
         <p className="text-center text-sm text-muted py-4">The queue is empty.</p>
       )}

      {queue.length > 0 && (
        <div>
          <h4 className="text-md font-bold text-main mt-4 mb-2 border-b border-border pb-1">Up Next ({queue.length}):</h4>
          <ul className="max-h-60 overflow-y-auto space-y-1 text-sm text-muted pr-2">
            {queue.map((card) => (
              <li key={card.name} className="truncate p-1.5 bg-surface-2 rounded-md">
                {card.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GenerationQueueMenu;
