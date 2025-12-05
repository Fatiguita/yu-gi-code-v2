import React, { useState } from 'react';
import { CoderCard } from '../types';

interface ManualArtAssignerProps {
  cards: CoderCard[];
  manualImageMap: Map<string, string>;
  onImageAssign: (cardName: string, imageUrl: string) => void;
}

const constructFullPrompt = (basePrompt: string): string => {
    return `A Yu-Gi-Oh card art style image of: ${basePrompt}, epic, fantasy, detailed, vibrant colors, 16:9 aspect ratio`;
};


const ManualArtAssigner: React.FC<ManualArtAssignerProps> = ({ cards, manualImageMap, onImageAssign }) => {
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [copyAllStatus, setCopyAllStatus] = useState<string>('Copy All Prompts');

  if (cards.length === 0) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, cardName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageAssign(cardName, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = (cardName: string, prompt: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopyStatus(prev => ({ ...prev, [cardName]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [cardName]: false }));
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleCopyAll = () => {
    const allPrompts = cards.map(card => `${card.name}:\n${constructFullPrompt(card.imagePrompt)}`).join('\n\n');
    navigator.clipboard.writeText(allPrompts).then(() => {
      setCopyAllStatus('All Copied!');
      setTimeout(() => {
        setCopyAllStatus('Copy All Prompts');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy all prompts: ', err);
    });
  };

  return (
    <div className="max-w-7xl mx-auto bg-surface-1 bg-opacity-70 p-6 rounded-lg border border-accent mt-12">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-accent mb-4">Manual Art Prompts</h3>
        <p className="text-muted mb-6">
          Manual Art Mode is active. Generate images for the prompts below and upload them.
        </p>
        <button
          onClick={handleCopyAll}
          disabled={copyAllStatus === 'All Copied!'}
          className={`btn ${copyAllStatus === 'All Copied!' ? 'bg-success' : 'btn-secondary'}`}
        >
          {copyAllStatus}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const fullPrompt = constructFullPrompt(card.imagePrompt);
          return (
            <div key={card.name} className="bg-surface-2 p-4 rounded-lg border border-muted flex flex-col gap-3">
              <h4 className="font-bold text-main truncate">{card.name}</h4>
              <div className="bg-black bg-opacity-30 p-3 rounded text-sm text-gray-300 font-mono flex-grow max-h-32 overflow-y-auto">
                {fullPrompt}
              </div>
              <div className="flex items-center gap-4 mt-2">
                {manualImageMap.has(card.name) && (
                  <img
                    src={manualImageMap.get(card.name)}
                    alt={`Preview for ${card.name}`}
                    className="w-16 h-16 object-cover rounded border-2 border-accent flex-shrink-0"
                  />
                )}
                <div className="flex-grow flex items-center gap-2">
                  <div className="flex-1">
                    <label
                      htmlFor={`file-upload-${card.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      className="w-full text-center cursor-pointer bg-secondary hover:brightness-110 text-main font-bold py-2 px-3 rounded shadow-md transition-colors text-sm block"
                    >
                      {manualImageMap.has(card.name) ? 'Change Image' : 'Upload Image'}
                    </label>
                    <input
                      id={`file-upload-${card.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, card.name)}
                    />
                  </div>
                  <button
                    onClick={() => handleCopy(card.name, fullPrompt)}
                    className={`flex-1 text-center cursor-pointer font-bold py-2 px-3 rounded shadow-md transition-colors text-sm block ${
                      copyStatus[card.name] ? 'bg-success' : 'bg-surface-1 hover:bg-gray-600'
                    } text-main`}
                  >
                    {copyStatus[card.name] ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManualArtAssigner;