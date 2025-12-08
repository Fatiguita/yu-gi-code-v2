import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { toBlob } from 'html-to-image';
import JSZip from 'jszip';
import { CoderCard, Theme, SkillLevel, SavedSession, SavedSessionState } from './types';
import { 
    generatePresentationCards, 
    getLibraryFunctions, 
    generateSelectedFunctionCards, 
    categorizeFunctions, 
    generateImage, 
    getConceptsForTheme,
    categorizeConcepts,
    generateSelectedCreativeCards,
    analyzeCodeTopic,
    createErrorCard
} from './services/geminiService';
import { clearImageCache, deleteImageFromCache } from './services/imageCache';
import { themes, defaultTheme } from './styles/themes';
import SearchBar from './components/SearchBar';
import CoderCardComponent from './components/CoderCard';
import Loader from './components/Loader';
import Legend from './components/Legend';
import Battlefield from './components/Battlefield';
import FunctionSelector from './FunctionSelector';
import CardDetailView from './components/CardDetailView';
import ThemeSelector from './components/ThemeSelector';
import SkillLevelSelector from './components/SkillLevelSelector';
import ManualArtToggle from './components/ManualArtToggle';
import ManualArtAssigner from './components/ManualArtAssigner';
import PrintDeckDialog from './components/PrintDeckDialog';
import SaveSessionDialog from './components/SaveSessionDialog';
import SessionGallery from './components/SessionGallery';
import GenerationQueueMenu from './components/GenerationQueueMenu';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog';


const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const GalleryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 002 2z" />
    </svg>
);

const QueueIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
);


const App: React.FC = () => {
  // 1. API Key: Lazy load
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });

  const [appMode, setAppMode] = useState<'code' | 'creative'>('code');
  const [presentationCards, setPresentationCards] = useState<CoderCard[]>([]);
  const [cards, setCards] = useState<CoderCard[]>([]);
  const [allFunctions, setAllFunctions] = useState<string[]>([]);
  const [functionCategories, setFunctionCategories] = useState<Record<string, string>>({});
  const [selectedFunctions, setSelectedFunctions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedLibrary, setSearchedLibrary] = useState<string>('');
  const [searchedLanguage, setSearchedLanguage] = useState<string>('');
  const [libraryInput, setLibraryInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [selectedCard, setSelectedCard] = useState<CoderCard | null>(null);
  const [isBattlefieldVisible, setIsBattlefieldVisible] = useState(false);
  const [deckDownloadStatus, setDeckDownloadStatus] = useState({ isLoading: false, progress: 0, total: 0 });
  const [clearCacheText, setClearCacheText] = useState('Clear Image Cache');

  // 2. Settings: Lazy load with defaults for persistence
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedName = localStorage.getItem('ygc_app_theme');
    return themes.find(t => t.name === savedName) || defaultTheme;
  });

  const [cardTheme, setCardTheme] = useState<'default' | 'official'>(() => {
    return (localStorage.getItem('ygc_card_theme') as 'default' | 'official') || 'default';
  });

  const [skillLevel, setSkillLevel] = useState<SkillLevel>(() => {
    return (localStorage.getItem('ygc_skill_level') as SkillLevel) || 'advanced';
  });

  const [isManualArtMode, setIsManualArtMode] = useState(() => {
    return localStorage.getItem('ygc_manual_art') === 'true';
  });

  // Session Persistence Setting
  const [isSessionPersistenceEnabled, setIsSessionPersistenceEnabled] = useState(() => {
      return localStorage.getItem('ygc_session_persistence') === 'true';
  });

  // Other UI states
  const [manualImageMap, setManualImageMap] = useState<Map<string, string>>(new Map());
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [deckToPrint, setDeckToPrint] = useState<CoderCard[]>([]);
  const [deckNameToPrint, setDeckNameToPrint] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Sessions
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [numPresentationCards, setNumPresentationCards] = useState<number>(6);
  const [isQueueMenuOpen, setIsQueueMenuOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const queueMenuContainerRef = useRef<HTMLDivElement>(null);
  
  // New robust queue state
  const [imageGenQueue, setImageGenQueue] = useState<CoderCard[]>([]);
  const [currentlyProcessingCard, setCurrentlyProcessingCard] = useState<CoderCard | null>(null);
  const totalInQueueRef = useRef(0);

  const startImageGeneration = useCallback((cardsToProcess: CoderCard[]) => {
    if (isManualArtMode || cardsToProcess.length === 0) return;

    setImageGenQueue(prevQueue => {
        const existingNamesInQueue = new Set(prevQueue.map(c => c.name));
        if (currentlyProcessingCard) {
            existingNamesInQueue.add(currentlyProcessingCard.name);
        }
        
        const uniqueNewCards = cardsToProcess.filter(c => !existingNamesInQueue.has(c.name));
        
        if (uniqueNewCards.length === 0) {
            return prevQueue;
        }
        
        const newQueue = [...prevQueue, ...uniqueNewCards];
        
        // If the queue was empty and we weren't processing, this is a fresh start
        if (!currentlyProcessingCard && prevQueue.length === 0) {
            totalInQueueRef.current = newQueue.length;
        } else { // Otherwise, we are adding to an active queue
            totalInQueueRef.current += uniqueNewCards.length;
        }

        return newQueue;
    });
  }, [currentlyProcessingCard, isManualArtMode]);


  const handleDeleteCardImageCache = useCallback((cardToDelete: CoderCard) => {
    if (isManualArtMode) {
        setManualImageMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(cardToDelete.name);
            return newMap;
        });
        return;
    }

    const fullPromptIdentifier = `fill_blank_canvas_v1:${cardToDelete.imagePrompt}`;
    deleteImageFromCache(fullPromptIdentifier);

    const updateStateForDeletion = (setter: React.Dispatch<React.SetStateAction<CoderCard[]>>) => {
        setter(prevCards => prevCards.map(c => 
            c.name === cardToDelete.name ? { ...c, imageUrl: undefined, isImageLoading: true } : c
        ));
    };
    updateStateForDeletion(setPresentationCards);
    updateStateForDeletion(setCards);

    const cardForQueue = { ...cardToDelete, imageUrl: undefined, isImageLoading: true };
    startImageGeneration([cardForQueue]);
  }, [startImageGeneration, isManualArtMode]);

  const handleRetryCardImageGeneration = useCallback((cardToRetry: CoderCard) => {
    const updateStateForRetry = (setter: React.Dispatch<React.SetStateAction<CoderCard[]>>) => {
        setter(prevCards => prevCards.map(c => 
            c.name === cardToRetry.name ? { ...c, isImageLoading: true } : c
        ));
    };

    updateStateForRetry(setPresentationCards);
    updateStateForRetry(setCards);

    const cardForQueue = { ...cardToRetry, isImageLoading: true };
    startImageGeneration([cardForQueue]);
  }, [startImageGeneration]);


  // --- Persistence Effects ---

  // Save UI Theme
  useEffect(() => {
    localStorage.setItem('ygc_app_theme', currentTheme.name);
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [currentTheme]);

  // Save Card Theme
  useEffect(() => {
    localStorage.setItem('ygc_card_theme', cardTheme);
  }, [cardTheme]);

  // Save Skill Level
  useEffect(() => {
    localStorage.setItem('ygc_skill_level', skillLevel);
  }, [skillLevel]);

  // Save Manual Art Mode
  useEffect(() => {
    localStorage.setItem('ygc_manual_art', String(isManualArtMode));
  }, [isManualArtMode]);
  
  // Save API Key
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini-api-key', apiKey);
    } else {
      localStorage.removeItem('gemini-api-key');
    }
  }, [apiKey]);
  
  // Save/Update Session Persistence Preference
  const toggleSessionPersistence = (enabled: boolean) => {
      setIsSessionPersistenceEnabled(enabled);
      localStorage.setItem('ygc_session_persistence', String(enabled));
      if (enabled) {
          // If turning on, immediately save current sessions to ensure they exist in storage
           localStorage.setItem('yu-gi-code-sessions', JSON.stringify(savedSessions));
      }
      // If turning off, we just stop updating, we don't necessarily wipe data (safer)
  };

  // Load Sessions (Conditional on Persistence Setting)
  useEffect(() => {
      if (isSessionPersistenceEnabled) {
        try {
            const storedSessions = localStorage.getItem('yu-gi-code-sessions');
            if (storedSessions) {
                setSavedSessions(JSON.parse(storedSessions));
            }
        } catch (error) {
            console.error("Failed to load sessions from localStorage", error);
        }
      }
  }, []); // Run once on mount

  // Save Sessions (Conditional on Persistence Setting)
  useEffect(() => {
      if (isSessionPersistenceEnabled) {
          try {
             localStorage.setItem('yu-gi-code-sessions', JSON.stringify(savedSessions));
          } catch (e) {
              console.error("Failed to save sessions to storage (likely quota exceeded):", e);
              setError("Storage Quota Exceeded. Some sessions may not persist. Try exporting to ZIP.");
          }
      }
  }, [savedSessions, isSessionPersistenceEnabled]);


  // New robust queue processing effect
  useEffect(() => {
    if (currentlyProcessingCard || imageGenQueue.length === 0 || !apiKey) {
      return; // Either processing, queue empty, or no API key
    }

    const nextCard = imageGenQueue[0];
    setCurrentlyProcessingCard(nextCard); // Lock for this card
    setImageGenQueue(prev => prev.slice(1)); // Remove from queue

    const processCard = async () => {
      try {
        const imageUrl = await generateImage(nextCard.imagePrompt, apiKey);
        const updateImageState = (setter: React.Dispatch<React.SetStateAction<CoderCard[]>>) => {
          setter(prevCards => prevCards.map(c =>
            c.name === nextCard.name ? { ...c, imageUrl, isImageLoading: false } : c
          ));
        };
        updateImageState(setPresentationCards);
        updateImageState(setCards);
      } catch (error) {
        console.error(`Failed to generate image for ${nextCard.name}`, error);
        const updateErrorState = (setter: React.Dispatch<React.SetStateAction<CoderCard[]>>) => {
          setter(prevCards => prevCards.map(c =>
            c.name === nextCard.name ? { ...c, isImageLoading: false } : c
          ));
        };
        updateErrorState(setPresentationCards);
        updateErrorState(setCards);
      } finally {
        setCurrentlyProcessingCard(null); // Unlock, allowing the effect to run for the next item
      }
    };

    processCard();
  }, [imageGenQueue, currentlyProcessingCard, apiKey]);


  useEffect(() => {
    const INACTIVITY_TIMEOUT = 120 * 60 * 1000; // 2 hours
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            console.log("2 hours of inactivity has passed. Clearing image cache.");
            clearImageCache();
        }, INACTIVITY_TIMEOUT);
    };

    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // Initialize timer

    return () => {
        clearTimeout(inactivityTimer);
        activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (queueMenuContainerRef.current && !queueMenuContainerRef.current.contains(event.target as Node)) {
            setIsQueueMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, []);

  const handleModeToggle = () => {
      const newMode = appMode === 'code' ? 'creative' : 'code';
      setAppMode(newMode);
      // Reset state when switching modes
      setPresentationCards([]);
      setCards([]);
      setAllFunctions([]);
      setFunctionCategories({});
      setSelectedFunctions(new Set());
      setError(null);
      setSearchedLibrary('');
      setSearchedLanguage('');
      setLibraryInput('');
      setLanguageInput('');
  };


  const handleSearch = useCallback(async (query: string, language?: string) => {
    if (!apiKey) {
      setError("Please enter your API Key in the settings.");
      setIsSettingsOpen(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    setCards([]);
    setPresentationCards([]);
    setAllFunctions([]);
    setFunctionCategories({});
    setSelectedFunctions(new Set());
    
    // Default setting for later use
    let refinedLibrary = query;
    let refinedLanguage = language || '';

    // Smart Topic Analysis (Logic Injection)
    if (appMode === 'code') {
      try {
        const analysis = await analyzeCodeTopic(query, language || '', apiKey);
        
        if (!analysis.isValid) {
          // It's invalid! Generate the Mock Trap Card.
          const errorCard = createErrorCard(query, analysis.reason || "Invalid code topic");
          
          setPresentationCards([errorCard]);
          // We trigger image generation for the error card too, so it looks cool
          startImageGeneration([errorCard]);
          
          setIsLoading(false);
          return; // Stop execution here
        }

        // It's valid, use the cleaned names
        refinedLibrary = analysis.refinedName;
        refinedLanguage = analysis.refinedLanguage;
        
        // Update input fields to reflect cleaned names (optional UI polish)
        setLibraryInput(refinedLibrary);
        if (refinedLanguage) setLanguageInput(refinedLanguage);

      } catch (err) {
        // If analysis fails, we just proceed as normal (fallback)
        console.warn("Topic analysis skipped due to error", err);
      }
    }

    setSearchedLibrary(refinedLibrary);
    setSearchedLanguage(refinedLanguage);
    
    try {
      if (appMode === 'code') {
        // Use refined inputs
        const functions = await getLibraryFunctions(refinedLibrary, refinedLanguage, apiKey);
        setAllFunctions(functions);

        const categories = await categorizeFunctions(refinedLibrary, refinedLanguage, functions, apiKey);
        setFunctionCategories(categories as Record<string, string>);

        if (numPresentationCards > 0) {
          const generatedCards = await generatePresentationCards(refinedLibrary, refinedLanguage, numPresentationCards, apiKey);
          setPresentationCards(generatedCards.map(c => ({...c, isImageLoading: !isManualArtMode})));
          startImageGeneration(generatedCards);
        } else {
          setPresentationCards([]);
        }
      } else { // Creative Mode
        const concepts = await getConceptsForTheme(query, apiKey);
        setAllFunctions(concepts); // 'allFunctions' state reused for concepts

        const categories = await categorizeConcepts(query, concepts, apiKey);
        setFunctionCategories(categories as Record<string, string>);
      }
    } catch (err) {
      const message: string = err instanceof Error ? err.message : String(err);
      if (message.includes("API Key")) {
        setError("Your API Key is invalid or expired. Please check it in the settings.");
        setIsSettingsOpen(true);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, appMode, numPresentationCards, startImageGeneration, isManualArtMode]);

  const handleCreativeSearch = (query: string) => {
    handleSearch(query);
  };

  const handleCodeSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (libraryInput.trim() && languageInput.trim()) {
          handleSearch(libraryInput.trim(), languageInput.trim());
      }
  };

const handleGenerateSelected = useCallback(async (options: { batchSize: number; cooldown: number }) => {
    if (selectedFunctions.size === 0) {
        setError("Please select at least one item to generate cards.");
        return;
    }
    if (!apiKey) {
        setError("Please enter your API Key in the settings before generating cards.");
        setIsSettingsOpen(true);
        return;
    }
    setIsGenerating(true);
    setError(null);

    const { batchSize, cooldown } = options;
    const allSelectedNames = Array.from(selectedFunctions).filter((name): name is string => typeof name === 'string');

    const initialCards = cards;
    const initialPresentationCards = presentationCards;

    const survivingCustomCards = initialCards.filter(c => allSelectedNames.includes(c.name));
    const survivingCustomCardNames = new Set(survivingCustomCards.map(c => c.name));

    const newItemsToProcess = allSelectedNames.filter(name => !survivingCustomCardNames.has(name));

    const reusablePresentationCards = initialPresentationCards.filter(c => newItemsToProcess.includes(c.name));
    const reusablePresentationCardNames = new Set(reusablePresentationCards.map(c => c.name));

    const initialDeck = [...survivingCustomCards, ...reusablePresentationCards];
    setCards(initialDeck.sort((a, b) => a.name.localeCompare(b.name)));

    const reusableToQueue = reusablePresentationCards
        .filter(c => !c.imageUrl)
        .map(c => ({ ...c, isImageLoading: !isManualArtMode }));

    if (reusableToQueue.length > 0) {
        startImageGeneration(reusableToQueue);
    }

    const itemsForApi = newItemsToProcess.filter(name => !reusablePresentationCardNames.has(name));
    const itemsWithCategory: { name: string; category: string }[] = itemsForApi.map(name => ({
        name,
        category: functionCategories[name] || 'Situational'
    }));

    const chunks: { name: string; category: string }[][] = [];
    for (let i = 0; i < itemsWithCategory.length; i += batchSize) {
        chunks.push(itemsWithCategory.slice(i, i + batchSize));
    }

    try {
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            const generatedChunk = appMode === 'code'
                ? await generateSelectedFunctionCards(searchedLibrary, searchedLanguage, chunk, apiKey)
                : await generateSelectedCreativeCards(searchedLibrary, chunk, apiKey); // searchedLibrary is the theme here

            const chunkWithLoadingState = generatedChunk.map(c => ({ ...c, isImageLoading: !isManualArtMode }));

            setCards(prevCards =>
                [...prevCards, ...chunkWithLoadingState].sort((a, b) => a.name.localeCompare(b.name))
            );

            startImageGeneration(chunkWithLoadingState);

            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, cooldown * 1000));
            }
        }
    } catch (err) {
      const message: string = err instanceof Error ? err.message : String(err);
      if (message.includes("API Key")) {
          setError("Your API Key is invalid or expired. Please check it in the settings.");
          setIsSettingsOpen(true);
      } else {
          setError(message);
      }
    } finally {
        setIsGenerating(false);
    }
}, [apiKey, appMode, selectedFunctions, searchedLibrary, searchedLanguage, cards, presentationCards, functionCategories, startImageGeneration, isManualArtMode]);
  
  const handleCardSelect = (card: CoderCard) => {
    setSelectedCard(card);
    setIsBattlefieldVisible(false);
  };

  const handleOpenBattlefield = () => {
    if (selectedCard) {
      setIsBattlefieldVisible(true);
    }
  };

  const handleCloseDetailView = () => {
    setSelectedCard(null);
  };
  
  const handleCloseBattlefield = () => {
    setIsBattlefieldVisible(false);
  };
  
  const handleDownloadDeck = async (cardsToDownload: CoderCard[], deckName: string) => {
    if (!cardsToDownload || cardsToDownload.length === 0) return;

    setDeckDownloadStatus({ isLoading: true, progress: 0, total: cardsToDownload.length });
    const zip = new JSZip();

    const renderContainer = document.createElement('div');
    renderContainer.style.position = 'absolute';
    renderContainer.style.left = '-9999px';
    renderContainer.style.top = '-9999px';
    renderContainer.style.width = '320px'; 
    renderContainer.style.height = '500px'; 
    document.body.appendChild(renderContainer);

    const root = createRoot(renderContainer);

    for (let i = 0; i < cardsToDownload.length; i++) {
        const card = cardsToDownload[i];
        setDeckDownloadStatus(prev => ({ ...prev, progress: i + 1 }));

        try {
            await new Promise<void>(resolve => {
                const enrichedCard = {
                    ...card,
                    imageUrl: isManualArtMode ? manualImageMap.get(card.name) : card.imageUrl,
                    isImageLoading: false,
                };
                const cardElement = (
                    <CoderCardComponent
                        card={enrichedCard}
                        cardTheme={cardTheme}
                        isInteractive={false}
                        libraryName={searchedLibrary}
                    />
                );
                root.render(cardElement);
                setTimeout(resolve, 500);
            });

            const cardNode = renderContainer.firstChild as HTMLElement;
            if (cardNode) {
                const blob = await toBlob(cardNode, { pixelRatio: 2 });
                if (blob) {
                    zip.file(`${card.name.replace(/[^a-z0-9]/gi, '_')}.png`, blob);
                }
            }
        } catch (e) {
            console.error(`Failed to generate image for card: ${card.name}`, e);
            zip.file(`FAILED_${card.name.replace(/[^a-z0-9]/gi, '_')}.txt`, `Could not generate image for this card.`);
        }
    }

    root.unmount();
    document.body.removeChild(renderContainer);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${deckName.replace(/[^a-z0-9]/gi, '_')}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setDeckDownloadStatus({ isLoading: false, progress: 0, total: 0 });
  };

  const handleClearCache = () => {
    clearImageCache();
    setClearCacheText('Cache Cleared!');
    setTimeout(() => setClearCacheText('Clear Image Cache'), 2000);
  };

  const handleImageAssign = (cardName: string, imageUrl: string) => {
    setManualImageMap(prev => new Map(prev).set(cardName, imageUrl));
  };

  const handleOpenPrintDialog = (cardsToPrint: CoderCard[], deckName: string) => {
    if (cardsToPrint.length === 0) {
        setError("There are no cards in this deck to print.");
        setTimeout(() => setError(null), 3000);
        return;
    }
    setDeckToPrint(cardsToPrint);
    setDeckNameToPrint(deckName);
    setIsPrintDialogOpen(true);
  };

  const handleClosePrintDialog = () => {
      setIsPrintDialogOpen(false);
  };
  
    const handleSaveSession = (sessionName: string) => {
    const currentState: SavedSessionState = {
      appMode,
      presentationCards,
      cards,
      allFunctions,
      functionCategories,
      selectedFunctions: Array.from(selectedFunctions),
      searchedLibrary,
      searchedLanguage,
      cardTheme,
      skillLevel,
      isManualArtMode,
      manualImageMap: Array.from(manualImageMap.entries()),
    };

    const newSession: SavedSession = {
      id: Date.now(),
      name: sessionName,
      libraryName: searchedLibrary,
      savedAt: Date.now(),
      state: currentState,
    };

    const updatedSessions = [...savedSessions, newSession];
    setSavedSessions(updatedSessions);
    // Note: LocalStorage save handled by useEffect if enabled
    setIsSaveDialogOpen(false);
  };

  const handleLoadSession = (sessionId: number) => {
    const sessionToLoad = savedSessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
      const { state } = sessionToLoad;
      setAppMode(state.appMode || 'code');
      setPresentationCards(
          (Array.isArray(state.presentationCards) ? state.presentationCards : []).filter(
              (c: any): c is CoderCard => c && typeof c === 'object' && typeof c.name === 'string'
          )
      );
      setCards(
          (Array.isArray(state.cards) ? state.cards : []).filter(
              (c: any): c is CoderCard => c && typeof c === 'object' && typeof c.name === 'string'
          )
      );
      
      const loadedAllFunctions = state.allFunctions;
      const safeAllFunctions: string[] = [];
      if (Array.isArray(loadedAllFunctions)) {
        for (const item of loadedAllFunctions) {
          if (typeof item === 'string') {
            safeAllFunctions.push(item);
          }
        }
      }
      setAllFunctions(safeAllFunctions);
      
      const loadedFuncCategories = state.functionCategories;
      const safeFunctionCategories: Record<string, string> = {};
      if (loadedFuncCategories && typeof loadedFuncCategories === 'object' && !Array.isArray(loadedFuncCategories)) {
          for (const key in loadedFuncCategories) {
              if (Object.prototype.hasOwnProperty.call(loadedFuncCategories, key)) {
                  const value = (loadedFuncCategories as any)[key];
                  if (typeof value === 'string') {
                      safeFunctionCategories[key] = value;
                  }
              }
          }
      }
      setFunctionCategories(safeFunctionCategories);

      const loadedSelectedFunctions = state.selectedFunctions;
      const safeSelectedFunctions: string[] = [];
      if (Array.isArray(loadedSelectedFunctions)) {
          for (const item of loadedSelectedFunctions) {
              if (typeof item === 'string') {
                  safeSelectedFunctions.push(item);
              }
          }
      }
      setSelectedFunctions(new Set(safeSelectedFunctions));

      setSearchedLibrary(state.searchedLibrary || '');
      setSearchedLanguage(state.searchedLanguage || '');
      // If session had a theme/skill level, load it into state (which will then persist to local storage via useEffect)
      if (state.cardTheme) setCardTheme(state.cardTheme);
      if (state.skillLevel) setSkillLevel(state.skillLevel);
      if (state.isManualArtMode !== undefined) setIsManualArtMode(state.isManualArtMode);

      const safeManualImageMap: [string, string][] = (Array.isArray(state.manualImageMap) ? state.manualImageMap : []).filter(
          (entry): entry is [string, string] =>
              Array.isArray(entry) &&
              entry.length === 2 &&
              typeof entry[0] === 'string' &&
              typeof entry[1] === 'string'
      );
      setManualImageMap(new Map(safeManualImageMap));
      
      setSelectedCard(null);
      setIsBattlefieldVisible(false);
      setError(null);
      
      setIsGalleryOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete === null) return;
    const updatedSessions = savedSessions.filter(s => s.id !== sessionToDelete);
    setSavedSessions(updatedSessions);
    // Note: LocalStorage sync handled by useEffect if enabled
    setSessionToDelete(null);
  };

  const handleCancelDelete = () => {
    setSessionToDelete(null);
  };

  const handleDeleteSession = (sessionId: number) => {
    setSessionToDelete(sessionId);
  };

  const handleImportSessions = (importedSessions: SavedSession[]) => {
      const maxExistingId = savedSessions.reduce((max, s) => Math.max(max, s.id), 0);
      let nextId = maxExistingId + 1;
      
      const newSessions = importedSessions.map(s => ({
          ...s,
          id: nextId++,
      }));

      const updatedSessions = [...savedSessions, ...newSessions];
      setSavedSessions(updatedSessions);
      // Note: LocalStorage sync handled by useEffect if enabled
      alert(`${newSessions.length} session(s) imported successfully!`);
      setIsGalleryOpen(false);
  };


  const enrichCard = (card: CoderCard): CoderCard => {
    return {
      ...card,
      imageUrl: isManualArtMode ? manualImageMap.get(card.name) : card.imageUrl,
      isImageLoading: isManualArtMode ? false : card.isImageLoading
    };
  };
  
  const isGeneratingImages = !!currentlyProcessingCard || imageGenQueue.length > 0;
  const totalQueueSize = totalInQueueRef.current;
    
  if (!isGeneratingImages && totalQueueSize > 0) {
      totalInQueueRef.current = 0;
  }

  const itemsLeft = imageGenQueue.length + (currentlyProcessingCard ? 1 : 0);
  const itemsProcessed = totalQueueSize > 0 ? totalQueueSize - itemsLeft : 0;
  
  let generationProgress: string | null = null;
  if (isGeneratingImages && currentlyProcessingCard) {
      generationProgress = `Generating art for "${currentlyProcessingCard.name}" (${itemsProcessed + 1} of ${totalQueueSize})`;
  } else if (isGeneratingImages) {
      generationProgress = 'Preparing generation...';
  }


  const WelcomeMessage = () => (
      <div className="text-center text-muted p-8 max-w-3xl mx-auto bg-black bg-opacity-30 rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold text-accent mb-4">Welcome to Yu-Gi-Code!</h2>
           {!apiKey && (
              <div className="mb-6 p-6 bg-surface-2 border-2 border-accent rounded-lg flex flex-col items-center gap-4">
                  <p className="text-xl text-white font-bold">To play, you need a Google Gemini API Key.</p>
                  <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-accent hover:brightness-110 text-black font-bold py-3 px-6 rounded-full transition-transform hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                      <span>Get API Key from Google AI Studio</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                  </a>
                  <p className="text-sm text-muted mt-2">Then enter it in the <SettingsIcon className="inline-block h-4 w-4 mx-1" /> settings.</p>
              </div>
          )}
          <p className="text-lg mb-2">
              It's time to code! Use the toggle to switch between **Code Mode** for programming libraries and **Creative Mode** for any concept you can imagine.
          </p>
          <p className="text-md text-gray-400">
              Enter a topic, generate cards, and then click a card to test your knowledge on the battlefield!
          </p>
      </div>
  );
  
  const SettingsModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface-1 p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-6 text-center text-accent">Settings</h3>
                
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <label htmlFor="api-key-input" className="block text-sm font-bold text-muted">
                            Google Gemini API Key
                        </label>
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:text-white underline flex items-center gap-1"
                        >
                            Get Key
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                    <input
                        id="api-key-input"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API Key here"
                        className="form-input w-full"
                    />
                </div>

                <div className="flex flex-col gap-6 items-center">
                    <ThemeSelector
                        currentTheme={currentTheme}
                        onThemeChange={setCurrentTheme}
                        cardTheme={cardTheme}
                        onCardThemeChange={setCardTheme}
                    />
                    <SkillLevelSelector
                        skillLevel={skillLevel}
                        onSkillLevelChange={setSkillLevel}
                    />
                    <ManualArtToggle isManual={isManualArtMode} onToggle={setIsManualArtMode} />
                    
                    {/* Session Persistence Toggle */}
                    <div className="w-full flex flex-col items-center gap-2 p-3 bg-surface-2 rounded-lg border border-muted">
                        <div className="flex items-center gap-2">
                            <label htmlFor="session-persist-toggle" className="text-xs font-bold text-muted">Auto-Save Sessions (Browser Storage)</label>
                            <button
                                id="session-persist-toggle"
                                onClick={() => toggleSessionPersistence(!isSessionPersistenceEnabled)}
                                className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors duration-300 ${
                                    isSessionPersistenceEnabled ? 'bg-success' : 'bg-gray-600'
                                }`}
                            >
                                <span className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform duration-300 ${
                                    isSessionPersistenceEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>
                        <p className="text-[10px] text-yellow-500 text-center">
                            Warning: Enabling this may slow down app startup if decks contain many high-res images. 
                            Use "Export" for better performance with large collections.
                        </p>
                    </div>

                    <button
                        onClick={handleClearCache}
                        className="bg-surface-2 hover:bg-danger text-main text-sm font-bold py-2 px-4 rounded-full transition-colors duration-300"
                        title="Clears the session's generated image cache."
                    >
                        {clearCacheText}
                    </button>
                </div>

                <button onClick={onClose} className="mt-8 w-full btn btn-primary">Close</button>
            </div>
        </div>
    );
  };

  const allVisibleCards = [...presentationCards, ...cards]
    .filter((card, index, self) => index === self.findIndex((c) => c.name === card.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen text-main p-4 sm:p-8">
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {isSaveDialogOpen && (
        <SaveSessionDialog
          onSave={handleSaveSession}
          onClose={() => setIsSaveDialogOpen(false)}
          defaultName={appMode === 'code' ? `${searchedLibrary} (${searchedLanguage}) Deck` : `${searchedLibrary} Creative Deck`}
        />
      )}
      {isGalleryOpen && (
        <SessionGallery
          sessions={savedSessions}
          onLoad={handleLoadSession}
          onDelete={handleDeleteSession}
          onClose={() => setIsGalleryOpen(false)}
          onImport={handleImportSessions}
        />
      )}
      {sessionToDelete !== null && (
        <ConfirmDeleteDialog
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          sessionName={savedSessions.find(s => s.id === sessionToDelete)?.name || 'this session'}
        />
      )}


      {selectedCard && !isBattlefieldVisible && (
        <CardDetailView 
          card={enrichCard(selectedCard)}
          cardTheme={cardTheme}
          onClose={handleCloseDetailView} 
          onChallenge={handleOpenBattlefield}
          libraryName={searchedLibrary}
        />
      )}
      {selectedCard && isBattlefieldVisible && (
        <Battlefield 
          card={selectedCard} 
          cardTheme={cardTheme} 
          onClose={handleCloseBattlefield}
          skillLevel={skillLevel}
          isManualArtMode={isManualArtMode}
          manualImageMap={manualImageMap}
          libraryName={searchedLibrary}
          language={searchedLanguage}
          appMode={appMode}
          apiKey={apiKey}
        />
      )}
       {isPrintDialogOpen && (
          <PrintDeckDialog
              cards={deckToPrint}
              deckName={deckNameToPrint}
              onClose={handleClosePrintDialog}
              cardTheme={cardTheme}
              isManualArtMode={isManualArtMode}
              manualImageMap={manualImageMap}
              libraryName={searchedLibrary}
          />
      )}
      <header className="text-center mb-8 relative">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter">
          <span className="gradient-text">
            Yu-Gi-Code!
          </span>
        </h1>
        <p className="text-muted mt-2 text-lg">The Developer's Dueling Deck</p>
        <div className="mt-4 flex justify-center gap-2 sm:absolute sm:top-0 sm:right-0 sm:mt-0 z-20">
         <button
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={!searchedLibrary || !apiKey}
            className="p-2 rounded-full bg-surface-1 hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Save current session"
            title="Save current session"
        >
            <SaveIcon />
        </button>
        <button
            onClick={() => setIsGalleryOpen(true)}
            className="p-2 rounded-full bg-surface-1 hover:bg-primary transition-colors"
            aria-label="Open session gallery"
            title="Open session gallery"
        >
            <GalleryIcon />
        </button>
        <div className="relative" ref={queueMenuContainerRef}>
            <button
                onClick={() => setIsQueueMenuOpen(prev => !prev)}
                className="p-2 rounded-full bg-surface-1 hover:bg-primary transition-colors relative"
                aria-label="Open generation queue"
                title="Generation Queue"
            >
                <QueueIcon className="h-6 w-6" />
                {isGeneratingImages && (
                     <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                )}
            </button>
            {isQueueMenuOpen && (
                <GenerationQueueMenu
                    queue={imageGenQueue}
                    progress={generationProgress}
                    isGenerating={isGeneratingImages}
                />
            )}
        </div>
         <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full bg-surface-1 hover:bg-primary transition-colors"
            aria-label="Open settings"
        >
            <SettingsIcon />
        </button>
      </div>
      </header>

      <main className="container mx-auto">
        <div className="mb-6">
            <div className="flex justify-center items-center gap-4 mb-4">
              <span className={`font-bold transition-colors ${appMode === 'code' ? 'text-accent' : 'text-muted'}`}>Code Mode</span>
              <button
                onClick={handleModeToggle}
                className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors duration-300 ${
                  appMode === 'creative' ? 'bg-primary' : 'bg-surface-2'
                } border border-border focus:outline-none focus:ring-2 focus:ring-accent`}
                role="switch"
                aria-checked={appMode === 'creative'}
                title="Toggle between Code and Creative modes"
              >
                <span className="sr-only">Toggle Mode</span>
                <span
                  className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-300 ${
                    appMode === 'creative' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`font-bold transition-colors ${appMode === 'creative' ? 'text-accent' : 'text-muted'}`}>Creative Mode</span>
            </div>

            {appMode === 'code' ? (
                <form onSubmit={handleCodeSearchSubmit} className="w-full max-w-2xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-center gap-2 bg-surface-2 border-2 border-accent rounded-lg sm:rounded-full shadow-lg overflow-hidden p-1">
                        <input
                            type="text"
                            value={libraryInput}
                            onChange={(e) => setLibraryInput(e.target.value)}
                            placeholder={"Library (e.g., React, numpy)"}
                            className="w-full sm:flex-grow py-3 px-6 text-main bg-transparent focus:outline-none placeholder-gray-500"
                            disabled={!apiKey || isGeneratingImages}
                        />
                        <div className="w-px h-6 bg-accent hidden sm:block self-center"></div>
                        <input
                            type="text"
                            value={languageInput}
                            onChange={(e) => setLanguageInput(e.target.value)}
                            placeholder={"Language (e.g., JavaScript)"}
                            className="w-full sm:flex-grow py-3 px-6 text-main bg-transparent focus:outline-none placeholder-gray-500"
                            disabled={!apiKey || isGeneratingImages}
                        />
                        <button
                            type="submit"
                            disabled={!apiKey || isGeneratingImages || !libraryInput.trim() || !languageInput.trim()}
                            className="bg-primary hover:brightness-110 text-main font-bold py-3 px-4 sm:px-8 transition duration-300 ease-in-out disabled:bg-gray-600 disabled:cursor-not-allowed w-full sm:w-auto rounded-full self-stretch sm:self-auto"
                        >
                            {isLoading ? 'Summoning...' : 'Generate'}
                        </button>
                    </div>
                </form>
            ) : (
                <SearchBar
                    onSearch={handleCreativeSearch}
                    isLoading={isLoading}
                    disabled={!apiKey || isGeneratingImages}
                    placeholder={"Enter a creative theme (e.g., 'Mythology', 'Space')..."}
                    buttonText={'Explore'}
                />
            )}

            {appMode === 'code' && (
              <div className="max-w-md mx-auto mt-4">
                <label htmlFor="num-cards-slider" className="block text-sm font-bold text-muted mb-2 text-center">
                    Presentation Cards: <span className="text-accent font-bold text-base">{numPresentationCards}</span>
                </label>
                <input
                    id="num-cards-slider"
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={numPresentationCards}
                    onChange={(e) => setNumPresentationCards(Number(e.target.value))}
                    className="w-full h-2 bg-surface-2 rounded-lg appearance-none cursor-pointer"
                    disabled={!apiKey || isLoading || isGeneratingImages}
                    aria-label="Number of presentation cards"
                />
              </div>
            )}
        </div>

        {(isLoading) && <Loader message={isLoading ? (appMode === 'code' ? 'Analyzing Tome...' : 'Exploring creative theme...') : undefined} />}
        
        {error && (
          <div className="text-center bg-danger border border-red-500 p-4 rounded-lg max-w-md mx-auto my-4">
            <h3 className="font-bold text-xl mb-2">Summoning Failed!</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {!isLoading && !searchedLibrary && (
          <WelcomeMessage />
        )}

        {appMode === 'code' && presentationCards.length > 0 && (
          <div className="mb-12">
             <div className="text-center mb-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                <h2 className="text-3xl font-bold text-center">Presentation Deck: <span className="text-accent">{searchedLibrary}</span></h2>
                <div className="flex flex-row sm:inline-flex">
                  <button 
                    onClick={() => handleDownloadDeck(presentationCards, `${searchedLibrary}_Presentation_Deck`)}
                    disabled={deckDownloadStatus.isLoading}
                    className="btn btn-secondary text-sm rounded-r-none px-4"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleOpenPrintDialog(presentationCards, `${searchedLibrary}_Presentation_Deck`)}
                    disabled={deckDownloadStatus.isLoading}
                    className="btn btn-accent text-sm rounded-l-none px-4"
                  >
                    Print
                  </button>
                </div>
             </div>
             {deckDownloadStatus.isLoading && (
                <p className="text-center text-accent mt-2">
                    Preparing download... ({deckDownloadStatus.progress}/{deckDownloadStatus.total})
                </p>
             )}
             <p className="text-center text-muted mb-4">A curated set of iconic functions to get you started.</p>
             <Legend />
            <div className="flex overflow-x-auto snap-x snap-mandatory py-4 sm:flex-wrap sm:justify-center sm:py-0 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 md:gap-6 mt-8 scrollbar-thin">
              {presentationCards.map((card) => (
                <div key={card.name} className="snap-start flex-shrink-0">
                  <CoderCardComponent 
                      card={enrichCard(card)} 
                      cardTheme={cardTheme} 
                      onCardClick={handleCardSelect} 
                      onDeleteCache={handleDeleteCardImageCache}
                      onRetryImage={isManualArtMode ? undefined : handleRetryCardImageGeneration}
                      libraryName={searchedLibrary}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {allFunctions.length > 0 && (
            <FunctionSelector 
                allFunctions={allFunctions}
                functionCategories={functionCategories}
                selectedFunctions={selectedFunctions}
                setSelectedFunctions={setSelectedFunctions}
                onGenerate={handleGenerateSelected}
                isLoading={isGenerating || isGeneratingImages}
                presentationCards={presentationCards}
                title={appMode === 'code' ? 'The Armory: Build Your Deck' : 'The Idea Forge: Create Your Deck'}
                description={appMode === 'code' 
                    ? 'Select functions from the list below to generate their cards. They have been categorized by importance.'
                    : `Select concepts related to "${searchedLibrary}" to generate their cards.`
                }
                filterPlaceholder={appMode === 'code' ? 'Filter functions...' : 'Filter concepts...'}
                generateButtonText={appMode === 'code' ? 'Generate' : 'Create'}
            />
        )}
        
        {(isGenerating || isGeneratingImages) && <div className="mt-8"><Loader message={generationProgress ?? (isGenerating ? 'Generating card data...' : undefined)} /></div>}
        
        {isManualArtMode && allVisibleCards.length > 0 && (
            <ManualArtAssigner
                cards={allVisibleCards}
                manualImageMap={manualImageMap}
                onImageAssign={handleImageAssign}
            />
        )}


        {cards.length > 0 && (
            <div className="mt-12">
                <div className="text-center mb-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                  <h2 className="text-3xl font-bold text-center">
                    {appMode === 'code' ? 'Your Custom Deck' : 'Generated Cards'}
                  </h2>
                   <div className="flex flex-row sm:inline-flex">
                    <button 
                      onClick={() => handleDownloadDeck(cards, `${searchedLibrary}_Custom_Deck`)}
                      disabled={deckDownloadStatus.isLoading}
                      className="btn btn-secondary text-sm rounded-r-none px-4"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleOpenPrintDialog(cards, `${searchedLibrary}_Custom_Deck`)}
                      disabled={deckDownloadStatus.isLoading}
                      className="btn btn-accent text-sm rounded-l-none px-4"
                    >
                      Print
                    </button>
                  </div>
                </div>
                 {deckDownloadStatus.isLoading && (
                    <p className="text-center text-accent -mt-6 mb-4">
                        Preparing download... ({deckDownloadStatus.progress}/{deckDownloadStatus.total})
                    </p>
                 )}
                <div className="flex overflow-x-auto snap-x snap-mandatory py-4 sm:flex-wrap sm:justify-center sm:py-0 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 md:gap-6 scrollbar-thin">
                {cards.map((card) => (
                  <div key={card.name} className="snap-start flex-shrink-0">
                    <CoderCardComponent 
                        card={enrichCard(card)}
                        cardTheme={cardTheme} 
                        onCardClick={handleCardSelect}
                        onDeleteCache={handleDeleteCardImageCache}
                        onRetryImage={isManualArtMode ? undefined : handleRetryCardImageGeneration}
                        libraryName={searchedLibrary}
                    />
                  </div>
                ))}
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
