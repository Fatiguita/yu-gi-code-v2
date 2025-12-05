import React from 'react';
import JSZip from 'jszip';
import { SavedSession, CoderCard } from '../types';

interface SessionGalleryProps {
  sessions: SavedSession[];
  onLoad: (sessionId: number) => void;
  onDelete: (sessionId: number) => void;
  onClose: () => void;
  onImport: (sessions: SavedSession[]) => void;
}

const SessionGallery: React.FC<SessionGalleryProps> = ({ sessions, onLoad, onDelete, onClose, onImport }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (sessions.length === 0) {
      alert("There are no sessions to export.");
      return;
    }

    try {
        const zip = new JSZip();
        // Create a deep clone to avoid modifying the component's state
        const sessionsForJson: SavedSession[] = JSON.parse(JSON.stringify(sessions));

        const processCards = (cardArray: CoderCard[], sessionId: number) => {
            if (!cardArray) return;
            for (const card of cardArray) {
                if (card.imageUrl && card.imageUrl.startsWith('data:image')) {
                    const [header, base64Data] = card.imageUrl.split(',');
                    if (base64Data) {
                        const safeCardName = card.name.replace(/[^a-z0-9]/gi, '_');
                        const imagePath = `images/${sessionId}/${safeCardName}.png`;
                        zip.file(imagePath, base64Data, { base64: true });
                        card.imageUrl = imagePath; // Replace base64 with a path reference
                    }
                }
            }
        };

        for (const session of sessionsForJson) {
            processCards(session.state.presentationCards, session.id);
            processCards(session.state.cards, session.id);

            if (session.state.manualImageMap) {
                session.state.manualImageMap = session.state.manualImageMap.map(([cardName, imageUrl]) => {
                    if (imageUrl && imageUrl.startsWith('data:image')) {
                        const [, base64Data] = imageUrl.split(',');
                        if (base64Data) {
                            const safeCardName = cardName.replace(/[^a-z0-9]/gi, '_');
                            const imagePath = `images/${session.id}/manual_${safeCardName}.png`;
                            zip.file(imagePath, base64Data, { base64: true });
                            return [cardName, imagePath]; // Replace with path
                        }
                    }
                    return [cardName, imageUrl];
                });
            }
        }

        zip.file('sessions.json', JSON.stringify(sessionsForJson, null, 2));

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'yu-gi-code-sessions.zip';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Failed to export sessions:", error);
        alert("An error occurred while creating the export file.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const zip = await JSZip.loadAsync(file);
        const sessionFile = zip.file('sessions.json');

        if (!sessionFile) {
            throw new Error("Invalid archive: sessions.json not found.");
        }

        const sessionJsonContent = await sessionFile.async('string');
        let importedSessions: SavedSession[];
        try {
            importedSessions = JSON.parse(sessionJsonContent);
        } catch (jsonError) {
            console.error('JSON parsing failed:', jsonError);
            throw new Error('The sessions.json file is corrupted or not valid JSON.');
        }
        
        const rehydrateCardImages = async (cardArray: CoderCard[]) => {
            if (!cardArray) return;
            for (const card of cardArray) {
                if (card.imageUrl && card.imageUrl.startsWith('images/')) {
                    const imageFile = zip.file(card.imageUrl);
                    if (imageFile) {
                        const base64Data = await imageFile.async('base64');
                        const mimeType = 'image/png';
                        card.imageUrl = `data:${mimeType};base64,${base64Data}`;
                    } else {
                        card.imageUrl = undefined; // Image path specified but not found in zip
                    }
                }
            }
        };

        for (const session of importedSessions) {
            await rehydrateCardImages(session.state.presentationCards);
            await rehydrateCardImages(session.state.cards);
            
            if (session.state.manualImageMap) {
                session.state.manualImageMap = await Promise.all(
                    session.state.manualImageMap.map(async ([cardName, imagePath]) => {
                        if (typeof imagePath === 'string' && imagePath.startsWith('images/')) {
                            const imageFile = zip.file(imagePath);
                            if (imageFile) {
                                const base64Data = await imageFile.async('base64');
                                const mimeType = 'image/png';
                                return [cardName, `data:${mimeType};base64,${base64Data}`];
                            }
                        }
                        return [cardName, imagePath];
                    })
                );
            }
        }
        
        onImport(importedSessions);

    } catch (error) {
        console.error("Failed to process session file:", error);
        alert("Error: Could not read or parse the session file. Please ensure it's a valid ZIP file exported from this application. Check the console for more details.");
    }
    
    if (event.target) {
        event.target.value = '';
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="relative bg-surface-1 p-6 rounded-lg shadow-2xl w-full max-w-4xl text-main max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted hover:text-main z-10"
          aria-label="Close Gallery"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-accent">Saved Sessions</h3>
            <div className="flex gap-2 mt-4 sm:mt-0">
                <button onClick={handleImportClick} className="btn btn-secondary text-sm py-2 px-4">Import</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".zip" className="hidden" />
                <button onClick={handleExport} className="btn btn-primary text-sm py-2 px-4">Export All</button>
            </div>
        </div>
        
        {sessions.length === 0 ? (
          <div className="text-center text-muted flex-grow flex items-center justify-center">
            <p>You have no saved sessions. Create some decks and save them!</p>
          </div>
        ) : (
          <div className="overflow-y-auto pr-2 -mr-2 space-y-4">
            {sessions.sort((a, b) => b.id - a.id).map(session => (
              <div key={session.id} className="bg-surface-2 p-4 rounded-lg border border-muted flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                  <h4 className="text-xl font-bold text-main">{session.name}</h4>
                  <p className="text-sm text-accent">{session.libraryName}</p>
                  <p className="text-xs text-muted mt-1">Saved on: {new Date(session.savedAt).toLocaleString()}</p>
                  <div className="flex gap-2 mt-3">
                    {(session.state.presentationCards || []).slice(0, 5).map(card => (
                      card.imageUrl && <img key={card.name} src={card.imageUrl} alt={card.name} className="w-10 h-10 object-cover rounded border-2 border-primary" />
                    ))}
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 flex-shrink-0 justify-center">
                  <button onClick={() => onLoad(session.id)} className="btn btn-primary text-sm py-2 px-4">Load</button>
                  <button onClick={() => onDelete(session.id)} className="bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-full text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionGallery;