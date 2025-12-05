import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { CoderCard } from '../types';
import CoderCardComponent from './CoderCard';
import Loader from './Loader';

interface PrintDeckDialogProps {
  cards: CoderCard[];
  deckName: string;
  onClose: () => void;
  cardTheme: 'default' | 'official';
  isManualArtMode: boolean;
  manualImageMap: Map<string, string>;
  libraryName: string;
}

type GridSize = '2x2' | '3x3';
type PaperSize = 'A4' | 'Letter';
type Orientation = 'portrait' | 'landscape';

const PAPER_SIZES = {
  A4: { width: 210, height: 297 }, // mm
  Letter: { width: 215.9, height: 279.4 }, // mm
};
const CARD_WIDTH_MM = 63;
const CARD_HEIGHT_MM = 88;

const PrintDeckDialog: React.FC<PrintDeckDialogProps> = ({ cards, deckName, onClose, cardTheme, isManualArtMode, manualImageMap, libraryName }) => {
  const [gridSize, setGridSize] = useState<GridSize>('3x3');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleGeneratePdf = useCallback(async () => {
    setIsLoading(true);
    setProgress({ current: 0, total: cards.length });

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: paperSize.toLowerCase(),
    });

    const [cols, rows] = gridSize.split('x').map(Number);
    const cardsPerPage = cols * rows;

    const renderContainer = document.createElement('div');
    renderContainer.style.position = 'absolute';
    renderContainer.style.left = '-9999px';
    renderContainer.style.top = '-9999px';
    renderContainer.style.width = '320px';
    renderContainer.style.height = '500px';
    document.body.appendChild(renderContainer);
    const root = createRoot(renderContainer);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      setProgress({ current: i + 1, total: cards.length });

      if (i > 0 && i % cardsPerPage === 0) {
        pdf.addPage();
      }

      try {
        await new Promise<void>((resolve) => {
          const enrichedCard = {
              ...card,
              imageUrl: isManualArtMode ? manualImageMap.get(card.name) : card.imageUrl,
              isImageLoading: false
          };
          root.render(
            <CoderCardComponent
              card={enrichedCard}
              cardTheme={cardTheme}
              isInteractive={false}
              libraryName={libraryName}
            />
          );
          setTimeout(resolve, 300); // Short delay for paint
        });

        const cardNode = renderContainer.firstChild as HTMLElement;
        if (cardNode) {
          const dataUrl = await toPng(cardNode, { pixelRatio: 2 });
          
          const paper = PAPER_SIZES[paperSize];
          const margin = 10;
          const paperWidth = orientation === 'portrait' ? paper.width : paper.height;
          const paperHeight = orientation === 'portrait' ? paper.height : paper.width;

          const usableWidth = paperWidth - (margin * 2);
          const usableHeight = paperHeight - (margin * 2);

          let cardWidth: number;
          let cardHeight: number;
          const standardAspectRatio = CARD_WIDTH_MM / CARD_HEIGHT_MM;

          if (gridSize === '2x2') {
              // For 2x2, maximize size to fit the usable area
              const maxWidthPerCard = usableWidth / cols;
              const maxHeightPerCard = usableHeight / rows;

              if (maxWidthPerCard / maxHeightPerCard > standardAspectRatio) {
                  // Page is wider than needed, so height is the limit
                  cardHeight = maxHeightPerCard;
                  cardWidth = cardHeight * standardAspectRatio;
              } else {
                  // Page is taller than needed, so width is the limit
                  cardWidth = maxWidthPerCard;
                  cardHeight = cardWidth / standardAspectRatio;
              }
          } else { // '3x3'
              cardWidth = CARD_WIDTH_MM;
              cardHeight = CARD_HEIGHT_MM;
          }
          
          // Use centering logic which works for any card size.
          // It distributes leftover space as gaps between cards.
          const totalGapsX = usableWidth - (cols * cardWidth);
          const gapX = cols > 1 ? totalGapsX / (cols - 1) : 0;
          
          const totalGapsY = usableHeight - (rows * cardHeight);
          const gapY = rows > 1 ? totalGapsY / (rows - 1) : 0;

          const cardIndexOnPage = i % cardsPerPage;
          const col = cardIndexOnPage % cols;
          const row = Math.floor(cardIndexOnPage / cols);
          
          const x = margin + col * (cardWidth + gapX);
          const y = margin + row * (cardHeight + gapY);

          pdf.addImage(dataUrl, 'PNG', x, y, cardWidth, cardHeight);
        }
      } catch (e) {
        console.error(`Failed to process card: ${card.name}`, e);
      }
    }

    pdf.save(`${deckName}.pdf`);

    root.unmount();
    document.body.removeChild(renderContainer);
    setIsLoading(false);
    onClose();
  }, [cards, deckName, gridSize, paperSize, orientation, cardTheme, isManualArtMode, manualImageMap, onClose, libraryName]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative bg-surface-1 p-6 rounded-lg shadow-2xl w-full max-w-md text-main"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted hover:text-main z-10"
          aria-label="Close print options"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <h3 className="text-2xl font-bold text-accent mb-6 text-center">Print Deck Options</h3>
        
        {isLoading ? (
          <div className="text-center">
            <Loader />
            <p className="mt-4">Generating PDF...</p>
            <p className="text-muted text-sm">Processing card {progress.current} of {progress.total}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="grid-size" className="font-bold">Grid Size:</label>
              <select id="grid-size" value={gridSize} onChange={(e) => setGridSize(e.target.value as GridSize)} className="form-input w-48 py-1 px-2 rounded-md">
                <option value="2x2">2x2 (4 cards per page)</option>
                <option value="3x3">3x3 (9 cards per page)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="paper-size" className="font-bold">Paper Size:</label>
              <select id="paper-size" value={paperSize} onChange={(e) => setPaperSize(e.target.value as PaperSize)} className="form-input w-48 py-1 px-2 rounded-md">
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="orientation" className="font-bold">Orientation:</label>
              <select id="orientation" value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)} className="form-input w-48 py-1 px-2 rounded-md">
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div className="pt-4 mt-4 border-t border-border">
              <button onClick={handleGeneratePdf} className="w-full btn btn-primary">
                Generate PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintDeckDialog;