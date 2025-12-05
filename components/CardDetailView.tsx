import React, { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { CoderCard } from '../types';
import CoderCardComponent from './CoderCard';

interface CardDetailViewProps {
  card: CoderCard;
  cardTheme: 'default' | 'official';
  onClose: () => void;
  onChallenge: () => void;
  libraryName: string;
}

const CardDetailView: React.FC<CardDetailViewProps> = ({ card, cardTheme, onClose, onChallenge, libraryName }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) {
      console.error("Card element not found.");
      return;
    }
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        pixelRatio: 2, // for higher resolution
      });
      const link = document.createElement('a');
      link.download = `${card.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download card image.', err);
    } finally {
      setIsDownloading(false);
    }
  }, [card.name]);

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up to the backdrop
      >
        <div className="flex-shrink-0">
          <CoderCardComponent 
            ref={cardRef} 
            card={card} 
            cardTheme={cardTheme} 
            isInteractive={false}
            libraryName={libraryName}
          />
        </div>

        <div className="flex flex-col gap-4 w-full max-w-[280px] sm:max-w-none sm:w-48">
            <button 
                onClick={onChallenge}
                className="btn btn-primary"
            >
                Challenge
            </button>
            <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="btn btn-secondary"
            >
                {isDownloading ? 'Downloading...' : 'Download Card'}
            </button>
            <button 
                onClick={onClose}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full transition-transform duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default CardDetailView;