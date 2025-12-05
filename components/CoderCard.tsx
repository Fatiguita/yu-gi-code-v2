import React, { useState, useEffect } from 'react';
import { CoderCard } from '../types';
import EffectIcon from './icons/EffectIcon';
import ParametersIcon from './icons/ParametersIcon';
import ReturnsIcon from './icons/ReturnsIcon';
import StructureIcon from './icons/StructureIcon';
import EffectRegionIcon from './icons/EffectRegionIcon';
import UtilityIcon from './icons/UtilityIcon';
import RenderIcon from './icons/RenderIcon';

interface CoderCardProps {
  card: CoderCard;
  cardTheme?: 'default' | 'official';
  onCardClick?: (card: CoderCard) => void;
  isInteractive?: boolean;
  isRevealed?: boolean;
  onDeleteCache?: (card: CoderCard) => void;
  onRetryImage?: (card: CoderCard) => void;
  libraryName?: string;
}

const officialCardStyles: { [key: string]: { frame: string; text: string; header: string; name: string; descriptionBg: string; } } = {
    'Effect Monster': { frame: '#FF8B33', text: '#000000', header: '#E57A2D', name: '#000000', descriptionBg: '#FFDDBB'},
    'Normal Monster': { frame: '#FDE68A', text: '#000000', header: '#E3CF7B', name: '#000000', descriptionBg: '#FFF8DD' },
    'Ritual Monster': { frame: '#9DB5CC', text: '#000000', header: '#8CA0B8', name: '#FFFFFF', descriptionBg: '#E0E8EF' },
    'Fusion Monster': { frame: '#A086B7', text: '#000000', header: '#9078A5', name: '#FFFFFF', descriptionBg: '#E2D9E9' },
    'Synchro Monster': { frame: '#CCCCCC', text: '#000000', header: '#B8B8B8', name: '#000000', descriptionBg: '#F0F0F0' },
    'Xyz Monster':    { frame: '#1F1F1F', text: '#FFFFFF', header: '#000000', name: '#FFFFFF', descriptionBg: '#C0C0C0' },
    'Link Monster':   { frame: '#00008B', text: '#FFFFFF', header: '#00006A', name: '#FFFFFF', descriptionBg: '#C0C0FF' },
    'Spell Card':     { frame: '#1D9E74', text: '#000000', header: '#198C65', name: '#FFFFFF', descriptionBg: '#DAF2E9' },
    'Trap Card':      { frame: '#BC5A84', text: '#000000', header: '#A95176', name: '#FFFFFF', descriptionBg: '#EEDCE5' },
    'default':        { frame: '#1e2c4d', text: '#FFFFFF', header: '#4a2e6b', name: '#FFFFFF', descriptionBg: '#D1D5DB' },
};


const LevelStars: React.FC<{ level: number }> = ({ level }) => {
  return (
    <div className="flex justify-end gap-1">
      {Array.from({ length: level }, (_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const OptionsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
);

const attributeIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    'STRUCTURE': StructureIcon,
    'EFFECT': EffectRegionIcon,
    'UTILITY': UtilityIcon,
    'RENDER': RenderIcon,
};


const CoderCardComponent = React.forwardRef<HTMLDivElement, CoderCardProps>(({ card, cardTheme = 'default', onCardClick, isInteractive = true, isRevealed = true, onDeleteCache, onRetryImage, libraryName }, ref) => {
  const styles = cardTheme === 'official' 
    ? (officialCardStyles[card.cardCategory] || officialCardStyles.default)
    : officialCardStyles.default;
    
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = () => setIsMenuOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteCache) {
      onDeleteCache(card);
    }
    setIsMenuOpen(false);
  };

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRetryImage) {
      onRetryImage(card);
    }
    setIsMenuOpen(false);
  };

  if (!isRevealed) {
    return (
        <div
            ref={ref}
            className={`w-[260px] h-[406.25px] sm:w-[320px] sm:h-[500px] bg-surface-2 border-4 border-black rounded-lg p-4 shadow-2xl flex items-center justify-center`}
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            aria-label={isInteractive ? `Select face down card` : `Face down card`}
            onClick={isInteractive && onCardClick ? () => onCardClick(card) : undefined}
        >
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary border-4 border-accent flex items-center justify-center shadow-lg">
                <svg className="w-24 h-24 text-accent opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
    );
  }

  const attributeColors: { [key: string]: string } = {
    'STRUCTURE': 'bg-yellow-700 text-white',
    'EFFECT': 'bg-purple-700 text-white',
    'UTILITY': 'bg-gray-600 text-white',
    'RENDER': 'bg-blue-600 text-white',
  };
  const defaultColor = 'bg-black bg-opacity-40 text-white';
  const attributeClass = attributeColors[card.attribute.toUpperCase()] || defaultColor;
  const AttributeIcon = attributeIcons[card.attribute.toUpperCase()];

  const interactiveClasses = isInteractive
    ? 'transform hover:scale-105 transition-transform duration-300 cursor-pointer'
    : '';
    
  const TIER_BG_COLORS: Record<string, string> = {
    Core: 'bg-yellow-500 border-yellow-700 text-black',
    Staple: 'bg-sky-400 border-sky-600 text-white',
    Situational: 'bg-green-500 border-green-700 text-white',
    Niche: 'bg-gray-500 border-gray-700 text-white',
  };
  const defaultTierColor = 'bg-black bg-opacity-60 border-gray-500 text-white';
  const tierColorClass = card.category ? (TIER_BG_COLORS[card.category] || defaultTierColor) : defaultTierColor;

  return (
    <div 
      ref={ref}
      style={{ backgroundColor: styles.frame, color: styles.text }}
      className={`relative w-[260px] h-[406.25px] sm:w-[320px] sm:h-[500px] border-4 border-[#121a2f] rounded-lg p-2 shadow-2xl font-['Matrix_Book'] flex flex-col ${interactiveClasses}`}
      onClick={isInteractive && onCardClick ? () => onCardClick(card) : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? `Select card ${card.name}` : undefined}
    >
      {/* Options Menu Button */}
      {(onDeleteCache || onRetryImage) && isInteractive && (
        <div className="absolute top-1 right-1 z-10" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleMenuToggle}
            className="p-1 rounded-full bg-black bg-opacity-40 text-white hover:bg-opacity-70 transition-opacity"
            aria-label="Card options"
            title="Card Options"
          >
            <OptionsIcon className="w-5 h-5" />
          </button>
          
          {/* Options Menu Panel */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-surface-1 border border-border rounded-md shadow-lg py-1 w-52 z-20">
              {onDeleteCache && (
                <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-3 py-1 text-sm text-main hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!card.imageUrl || card.isImageLoading}
                >
                  Delete Cached Image
                </button>
              )}
              {onRetryImage && (
                <button
                  onClick={handleRetryClick}
                  className="w-full text-left px-3 py-1 text-sm text-main hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!!card.imageUrl || card.isImageLoading}
                >
                  Retry Image Generation
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: styles.header }} className="rounded p-1 flex justify-between items-center">
        <h2 style={{ color: styles.name }} className="text-lg sm:text-xl font-bold truncate pl-1">{card.name}</h2>
        <div title={card.attribute} className={`px-2 py-1 rounded text-xs font-bold ${attributeClass}`}>
            {card.attribute}
        </div>
      </div>
      
      {/* Level */}
      <div className="my-1 pr-1">
        <LevelStars level={card.level} />
      </div>

      {/* Image */}
      <div className="relative bg-black border-2 border-gray-600 p-1 flex-shrink-0 w-full h-[146px] sm:h-[180px] flex items-center justify-center">
        {card.isImageLoading ? (
          <div className="text-center text-gray-400 text-sm p-2">
            <svg className="animate-spin h-5 w-5 text-purple-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Summoning Art...
          </div>
        ) : card.imageUrl ? (
          <img src={card.imageUrl} alt={`Art for ${card.name}`} className="w-full h-full object-cover" />
        ) : (
            <div className="text-sm p-2 text-center text-red-400">
              Art not available.
            </div>
        )}
        {/* Overlays */}
        {libraryName && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black bg-opacity-50 rounded text-white text-[9px] sm:text-[10px] font-mono opacity-80 max-w-[50%] truncate">
                {libraryName}
            </div>
        )}
        {card.category && (
            <div title={card.category} className={`absolute top-1 right-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md border ${tierColorClass}`}>
                {card.category}
            </div>
        )}
        {card.language && (
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black bg-opacity-50 rounded text-white text-[9px] sm:text-[10px] font-mono opacity-80 max-w-[50%] truncate">
                {card.language}
            </div>
        )}
         {/* Region Logo */}
        <div title={card.attribute} className="absolute bottom-1 right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-black bg-opacity-60 border border-gray-500">
            {AttributeIcon && <AttributeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
        </div>
      </div>
      
      {/* Type */}
      <div className="border-t-4 border-b-2 border-gray-600 my-1 py-0.5 px-2">
         <p style={{ color: styles.text }} className="text-xs sm:text-sm font-extrabold tracking-wider">
          {`[ ${card.cardCategory} / ${card.type.replace(/[\[\]]/g, '')} ]`}
        </p>
      </div>
      
      {/* Description */}
      <div style={{ backgroundColor: styles.descriptionBg, color: '#000000' }} className="p-2 flex-grow text-[11px] leading-snug sm:text-xs sm:leading-snug border border-gray-900 overflow-auto space-y-1.5 sm:space-y-2 text-left">
        <div className="flex items-start gap-1.5">
            <EffectIcon className="w-5 h-5 flex-shrink-0 text-yellow-600" />
            <p><strong className="font-sans font-bold">Effect:</strong> {card.description.effect}</p>
        </div>
        <div className="flex items-start gap-1.5">
            <ParametersIcon className="w-5 h-5 flex-shrink-0 text-blue-600" />
            <p><strong className="font-sans font-bold">Params:</strong> {card.description.parameters}</p>
        </div>
        <div className="flex items-start gap-1.5">
            <ReturnsIcon className="w-5 h-5 flex-shrink-0 text-green-600" />
            <p><strong className="font-sans font-bold">Returns:</strong> {card.description.returns}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-center border-t-2 border-gray-600 mt-auto pt-1 text-xs sm:text-sm font-bold">
        <div className="w-1/2">IMP/{card.impact}</div>
        <div className="w-1/2 border-l border-gray-500">EZU/{card.easeOfUse}</div>
      </div>
    </div>
  );
});

export default CoderCardComponent;