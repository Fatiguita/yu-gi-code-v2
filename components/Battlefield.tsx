import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CoderCard, QuizQuestion, SyntaxExercise, ImplementationChallenge, SkillLevel, ChatMessage } from '../types';
import { generateUseCaseQuiz, generateSyntaxExercise, generateDuelDeck, generateImplementationChallenge, generateImage, getChatbotResponse } from '../services/geminiService';
import Loader from './Loader';
import CoderCardComponent from './CoderCard';
import CodeSnippetViewer from './CodeSnippetViewer';

interface BattlefieldProps {
  card: CoderCard;
  cardTheme: 'default' | 'official';
  onClose: () => void;
  skillLevel: SkillLevel;
  isManualArtMode: boolean;
  manualImageMap: Map<string, string>;
  libraryName: string;
  language: string;
  appMode: 'code' | 'creative';
  apiKey: string;
}

type BattleState = 'idle' | 'loading' | 'quiz' | 'syntax' | 'result' | 'duel_difficulty_select' | 'duel_setup' | 'duel_playing' | 'duel_game_over';
type Difficulty = 'easy' | 'medium' | 'hard' | 'custom' | 'none';

const DIFFICULTY_SETTINGS: Record<Difficulty, { time: number; name: string }> = {
    easy: { time: 90, name: "Easy (1:30)" },
    medium: { time: 60, name: "Medium (1:00)" },
    hard: { time: 30, name: "Hard (0:30)" },
    custom: { time: 0, name: "Custom Time" },
    none: { time: Infinity, name: "No Timer" },
};

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const normalizeCodeForComparison = (code: string) => {
    return code.replace(/\s/g, "").toLowerCase();
};

const formatTime = (seconds: number) => {
    if (seconds === Infinity || isNaN(seconds)) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SimpleMarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const toHtml = (md: string) => {
        let html = md;
        // Handle code blocks first to prevent inner markdown from being parsed
        html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
            const escapedCode = code
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
            return `<pre class="bg-black bg-opacity-40 p-2 rounded my-2 text-sm font-mono overflow-x-auto"><code>${escapedCode}</code></pre>`;
        });

        // Handle lists, merging consecutive list items
        html = html.replace(/^\s*[-*]\s(.*)$/gm, '<ul><li>$1</li></ul>');
        html = html.replace(/<\/ul>\s*\r?\n<ul>/g, '');

        // Handle inline elements
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/`([^`]+)`/g, '<code class="bg-black bg-opacity-40 px-1 py-0.5 rounded text-accent font-mono">$1</code>');
        
        // Handle newlines -> <br> for lines not inside a block element
        const parts = html.split(/(<pre[\s\S]*?<\/pre>|<ul>[\s\S]*?<\/ul>)/);
        html = parts.map((part, index) => {
            if (index % 2 === 0) { // Not a pre or ul block
                return part.trim().replace(/\r?\n/g, '<br />');
            }
            return part;
        }).join('');

        return html;
    };

    return <div className="text-sm text-left whitespace-normal" dangerouslySetInnerHTML={{ __html: toHtml(text) }} />;
};


const Battlefield: React.FC<BattlefieldProps> = ({ card, cardTheme, onClose, skillLevel, isManualArtMode, manualImageMap, libraryName, language, appMode, apiKey }) => {
  const [battleState, setBattleState] = useState<BattleState>('idle');
  const [quizData, setQuizData] = useState<QuizQuestion | null>(null);
  const [syntaxData, setSyntaxData] = useState<SyntaxExercise | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Preview Modal State
  const [previewCard, setPreviewCard] = useState<CoderCard | null>(null);

  // New state for the review modal
  const [isExerciseReviewOpen, setIsExerciseReviewOpen] = useState(false);

  // Chatbot State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Duel State
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [customTime, setCustomTime] = useState<number>(5); // in minutes
  const [isCustomizingTime, setIsCustomizingTime] = useState<boolean>(false);
  const [hand, setHand] = useState<CoderCard[]>([]);
  const [deck, setDeck] = useState<CoderCard[]>([]);
  const [allDuelCards, setAllDuelCards] = useState<CoderCard[]>([]);
  const [duelChallenge, setDuelChallenge] = useState<ImplementationChallenge | SyntaxExercise | null>(null);
  const [targetCard, setTargetCard] = useState<CoderCard | null>(null);
  const [timer, setTimer] = useState(60);
  const [strikes, setStrikes] = useState(0);
  const [duelMessage, setDuelMessage] = useState({ title: '', body: '' });
  const [answeringCard, setAnsweringCard] = useState<CoderCard | null>(null);
  const [duelUserAnswer, setDuelUserAnswer] = useState('');
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());
  const [isDuelAnswerCorrect, setIsDuelAnswerCorrect] = useState<boolean | null>(null);

  // Ref for the hand container to control scrolling
  const handContainerRef = useRef<HTMLDivElement>(null);

  // Helper to scroll the hand container
  const scrollHand = (direction: 'left' | 'right') => {
    if (handContainerRef.current) {
        const scrollAmount = 200; // Approximate width of a card + gap
        handContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }
  };

  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const startChallengeTimer = useCallback((difficultyForTurn: Difficulty) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    let timeLimit: number;
    if (difficultyForTurn === 'custom') {
        timeLimit = customTime * 60;
    } else {
        timeLimit = DIFFICULTY_SETTINGS[difficultyForTurn].time;
    }

    if (timeLimit === Infinity) {
        setTimer(Infinity);
        return; // Don't start interval for no-timer mode
    }
    
    setTimer(timeLimit);
    timerIntervalRef.current = window.setInterval(() => {
        setTimer(prev => {
            if (prev <= 1) {
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                setDuelMessage({ title: "Defeated!", body: "Time ran out! The sands of the arena have claimed another." });
                setChatHistory([]);
                setBattleState('duel_game_over');
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  }, [customTime]);
  
  useEffect(() => {
    return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, []);

  const fetchUseCaseQuiz = useCallback(async () => {
    setBattleState('loading');
    setError(null);
    try {
      const data = await generateUseCaseQuiz(card, apiKey);
      setQuizData(data);
      setBattleState('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create a quiz for this card.");
      setBattleState('idle');
    }
  }, [card, apiKey]);

  const fetchSyntaxExercise = useCallback(async () => {
    setBattleState('loading');
    setError(null);
    try {
      const data = await generateSyntaxExercise(card, language, apiKey);
      setSyntaxData(data);
      setBattleState('syntax');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create an exercise for this card.");
      setBattleState('idle');
    }
  }, [card, language, apiKey]);

  const startNewDuelTurn = useCallback(async (currentAllCards: CoderCard[], difficultyForTurn?: Difficulty) => {
    setAnsweringCard(null);
    setDuelUserAnswer('');
    setError(null);
    if (currentAllCards.length === 0) {
        setError("Could not generate a duel deck.");
        setBattleState('idle');
        return;
    }
    const newTargetCard = currentAllCards[Math.floor(Math.random() * currentAllCards.length)];
    setTargetCard(newTargetCard);
    try {
        if (skillLevel === 'beginner') {
            const newChallenge = await generateSyntaxExercise(newTargetCard, language, apiKey);
            setDuelChallenge(newChallenge);
        } else {
            const newChallenge = await generateImplementationChallenge(newTargetCard, apiKey, skillLevel);
            setDuelChallenge(newChallenge);
        }
        startChallengeTimer(difficultyForTurn || difficulty);
    } catch (err) {
        setError(err instanceof Error ? `Failed to generate a new challenge: ${err.message}. Try skipping.` : "Failed to generate a new challenge. Try skipping.");
    }
  }, [startChallengeTimer, skillLevel, difficulty, apiKey, language]);

  const enrichCardForDisplay = (c: CoderCard): CoderCard => {
    return {
      ...c,
      imageUrl: isManualArtMode ? manualImageMap.get(c.name) : c.imageUrl,
      isImageLoading: isManualArtMode ? false : c.isImageLoading,
    };
  };

  const setupDuel = useCallback(async (selectedDifficulty: Difficulty) => {
    setBattleState('duel_setup');
    setDifficulty(selectedDifficulty);
    setError(null);
    try {
        const otherCards = await generateDuelDeck(card, libraryName, language, apiKey);
        const fullDeck = shuffleArray([card, ...otherCards]);
        setAllDuelCards(fullDeck);
        setHand(fullDeck.slice(0, 4).map(c => ({...c, isImageLoading: true})));
        setDeck(fullDeck.slice(4).map(c => ({...c, isImageLoading: true})));
        setStrikes(0);

        // Start image generation for the whole duel deck
        (async () => {
            for (const cardToProcess of fullDeck) {
                try {
                    const imageUrl = await generateImage(cardToProcess.imagePrompt, apiKey);
                    setAllDuelCards(prev => prev.map(c => c.name === cardToProcess.name ? {...c, imageUrl, isImageLoading: false} : c));
                    setHand(prev => prev.map(c => c.name === cardToProcess.name ? {...c, imageUrl, isImageLoading: false} : c));
                    setDeck(prev => prev.map(c => c.name === cardToProcess.name ? {...c, imageUrl, isImageLoading: false} : c));
                } catch (e) {
                    console.error("Failed to generate duel image for", cardToProcess.name);
                    setAllDuelCards(prev => prev.map(c => c.name === cardToProcess.name ? {...c, isImageLoading: false} : c));
                    setHand(prev => prev.map(c => c.name === cardToProcess.name ? {...c, isImageLoading: false} : c));
                    setDeck(prev => prev.map(c => c.name === cardToProcess.name ? {...c, isImageLoading: false} : c));
                }
            }
        })();

        await startNewDuelTurn(fullDeck, selectedDifficulty);
        setBattleState('duel_playing');
    } catch(err) {
        setError(err instanceof Error ? err.message : "Failed to generate the duel deck.");
        setBattleState('idle');
    }
  }, [card, startNewDuelTurn, libraryName, language, apiKey]);

  const handleDrawCard = () => {
    if (deck.length > 0 && hand.length < 7) {
        const newCard = deck[0];
        setDeck(deck.slice(1));
        setHand([...hand, newCard]);
    }
  };

  const handleSkipChallenge = () => {
    const newStrikes = strikes + 1;
    setStrikes(newStrikes);
    if (newStrikes >= 3) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setDuelMessage({ title: "Defeated!", body: "You have retreated too many times. The duel is lost." });
        setChatHistory([]);
        setBattleState('duel_game_over');
    } else {
        startNewDuelTurn(allDuelCards);
    }
  };

  const handleViewCardDetails = useCallback((card: CoderCard) => {
    setPreviewCard(card);
  }, []);
  
  const handleSelectHandCard = (selectedCard: CoderCard) => {
    if (!duelChallenge || answeringCard) return;

    // For syntax exercises (beginner), the target is the card the challenge was made for
    if ('blankAnswer' in duelChallenge && !('targetFunction' in duelChallenge)) {
        if (selectedCard.name === targetCard?.name) {
            setAnsweringCard(selectedCard);
        } else {
            const newStrikes = strikes + 1;
            setStrikes(newStrikes);
            setError(`That's not the right function! Strike!`);
            setTimeout(() => setError(null), 2500);
            if (newStrikes >= 3) {
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                setDuelMessage({ title: "Defeated!", body: "Three incorrect plays! The duel is lost." });
                setChatHistory([]);
                setBattleState('duel_game_over');
            }
        }
        return;
    }

    // For implementation challenges (intermediate/advanced)
    if (!revealedCards.has(selectedCard.name)) {
        setRevealedCards(prev => new Set(prev).add(selectedCard.name));
        return;
    }

    if (duelChallenge && 'targetFunction' in duelChallenge && selectedCard.name === duelChallenge.targetFunction) {
        setAnsweringCard(selectedCard);
    } else {
        const newStrikes = strikes + 1;
        setStrikes(newStrikes);
        setError(`That's not the right function! Strike!`);
        setTimeout(() => setError(null), 2500);

        if (newStrikes >= 3) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setDuelMessage({ title: "Defeated!", body: "Three incorrect plays! The duel is lost." });
            setChatHistory([]);
            setBattleState('duel_game_over');
        }
    }
  };


  const handleDuelSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!duelChallenge) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const correctAnswer = duelChallenge.blankAnswer;
    const isAnswerCorrect = normalizeCodeForComparison(duelUserAnswer) === normalizeCodeForComparison(correctAnswer);
    setIsDuelAnswerCorrect(isAnswerCorrect);
    setChatHistory([]);

    if (isAnswerCorrect) {
        setDuelMessage({ title: "Victory!", body: duelChallenge.explanation });
    } else {
        setDuelMessage({ title: "Defeated!", body: `Incorrect. The correct answer was: ${correctAnswer}. ${duelChallenge.explanation}` });
    }
    setBattleState('duel_game_over');
  };

  const handleQuizSubmit = (selectedIndex: number) => {
    if (!quizData) return;
    setUserAnswer(selectedIndex);
    setIsCorrect(selectedIndex === quizData.correctAnswerIndex);
    setChatHistory([]);
    setBattleState('result');
  };
  
  const handleSyntaxSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!syntaxData) return;
    const isAnswerCorrect = typeof userAnswer === 'string' && 
                            userAnswer.trim().toLowerCase() === syntaxData.blankAnswer.trim().toLowerCase();
    setIsCorrect(isAnswerCorrect);
    setChatHistory([]);
    setBattleState('result');
  };

    const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || isChatbotLoading) return;
    
      const newUserMessage: ChatMessage = { sender: 'user', text: chatInput };
      const newHistory = [...chatHistory, newUserMessage];
      setChatHistory(newHistory);
      setChatInput('');
      setIsChatbotLoading(true);
    
      try {
        let exerciseContext: any;

        if (battleState === 'result') {
          exerciseContext = quizData
            ? { type: 'quiz', card, question: quizData.question, options: quizData.options, correctAnswer: quizData.options[quizData.correctAnswerIndex], userAnswer: quizData.options[userAnswer as number], isCorrect }
            : { type: 'syntax', card, snippet: syntaxData!.snippet, correctAnswer: syntaxData!.blankAnswer, userAnswer: userAnswer as string, isCorrect };
        } else if (battleState === 'duel_game_over' && duelChallenge && targetCard) {
          exerciseContext = {
            type: 'duel',
            card: targetCard,
            snippet: duelChallenge.snippet,
            correctAnswer: duelChallenge.blankAnswer,
            userAnswer: duelUserAnswer,
            isCorrect: isDuelAnswerCorrect
          };
        } else {
          throw new Error("Cannot determine exercise context for Bruno.");
        }
        
        const aiResponseText = await getChatbotResponse(exerciseContext, newHistory, apiKey);
        setChatHistory(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
          console.error("Chatbot error:", errorMessage);
          setChatHistory(prev => [...prev, { sender: 'ai', text: "Sorry, I encountered an error and cannot respond right now." }]);
      } finally {
        setIsChatbotLoading(false);
      }
    };

  const handleRetryChallenge = () => {
    const wasQuiz = !!quizData;
    setUserAnswer(null);
    setIsCorrect(null);

    if (wasQuiz) {
        fetchUseCaseQuiz();
    } else {
        fetchSyntaxExercise();
    }
  };

  const resetBattle = () => {
    setBattleState('idle');
    setQuizData(null);
    setSyntaxData(null);
    setUserAnswer(null);
    setIsCorrect(null);
    setError(null);
    setHand([]);
    setDeck([]);
    setAllDuelCards([]);
    setDuelChallenge(null);
    setTargetCard(null);
    setStrikes(0);
    setAnsweringCard(null);
    setDuelUserAnswer('');
    setRevealedCards(new Set());
    setIsCustomizingTime(false);
    setIsDuelAnswerCorrect(null);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };
  
  const CardPreviewModal = () => {
    if (!previewCard) return null;
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex flex-col items-center justify-center p-4"
            onClick={() => setPreviewCard(null)}
        >
            <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setPreviewCard(null)}
                    className="absolute -top-12 right-0 sm:-right-12 text-white hover:text-accent bg-surface-1 rounded-full p-2 border border-muted"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                {/* Render the card large */}
                <CoderCardComponent 
                    card={enrichCardForDisplay(previewCard)}
                    cardTheme={cardTheme}
                    isInteractive={false} 
                    libraryName={libraryName}
                />
            </div>
            <p className="mt-4 text-muted text-sm">Tap anywhere outside to close</p>
        </div>
    );
  };

  const ExerciseReviewModal = () => {
    let content;
    if (battleState === 'result') {
        if (quizData) {
            content = (
                <>
                    <h4 className="font-bold text-lg mb-2">Quiz Question:</h4>
                    <p className="bg-surface-2 p-3 rounded mb-4">{quizData.question}</p>
                    <h4 className="font-bold text-lg mb-2">Your Answer:</h4>
                    <p className={`p-3 rounded mb-4 ${isCorrect ? 'bg-success' : 'bg-danger'}`}>{quizData.options[userAnswer as number]}</p>
                    {!isCorrect && (
                        <>
                            <h4 className="font-bold text-lg mb-2">Correct Answer:</h4>
                            <p className="bg-success p-3 rounded mb-4">{quizData.options[quizData.correctAnswerIndex]}</p>
                        </>
                    )}
                </>
            );
        } else if (syntaxData) {
            content = (
                <>
                    <h4 className="font-bold text-lg mb-2">Code Snippet:</h4>
                    <CodeSnippetViewer code={syntaxData.snippet} className="text-sm mb-4" />
                    <h4 className="font-bold text-lg mb-2">Your Answer:</h4>
                    <p className={`p-3 rounded mb-4 font-mono ${isCorrect ? 'bg-success' : 'bg-danger'}`}>{userAnswer as string || '(No answer given)'}</p>
                    {!isCorrect && (
                        <>
                            <h4 className="font-bold text-lg mb-2">Correct Answer:</h4>
                            <p className="bg-success p-3 rounded mb-4 font-mono">{syntaxData.blankAnswer}</p>
                        </>
                    )}
                </>
            );
        }
    } else if (battleState === 'duel_game_over' && duelChallenge) {
         content = (
            <>
                <h4 className="font-bold text-lg mb-2">Challenge Snippet:</h4>
                <CodeSnippetViewer code={duelChallenge.snippet} className="text-sm mb-4" />
                <h4 className="font-bold text-lg mb-2">Your Answer:</h4>
                <p className={`p-3 rounded mb-4 font-mono ${isDuelAnswerCorrect ? 'bg-success' : 'bg-danger'}`}>{duelUserAnswer || '(No answer given)'}</p>
                {!isDuelAnswerCorrect && (
                    <>
                        <h4 className="font-bold text-lg mb-2">Correct Answer:</h4>
                        <p className="bg-success p-3 rounded mb-4 font-mono">{duelChallenge.blankAnswer}</p>
                    </>
                )}
            </>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setIsExerciseReviewOpen(false)}>
            <div className="bg-surface-1 p-6 rounded-lg shadow-2xl w-full max-w-2xl text-main max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-accent mb-4 text-center">Exercise Review</h3>
                <div className="overflow-y-auto pr-2 -mr-2">{content}</div>
                <button onClick={() => setIsExerciseReviewOpen(false)} className="mt-6 w-full btn btn-primary">Close</button>
            </div>
        </div>
    );
  }

  const renderContent = () => {
    switch (battleState) {
      case 'loading':
      case 'duel_setup':
        return <div className="flex justify-center items-center h-full"><Loader /></div>;
      case 'quiz':
        return quizData && (
          <div>
            <h3 className="text-xl mb-4">{quizData.question}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quizData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuizSubmit(index)}
                  className="bg-surface-2 hover:bg-primary text-main font-bold py-3 px-4 rounded-lg transition-colors shadow-lg text-left"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case 'syntax':
        return syntaxData && (
          <form onSubmit={handleSyntaxSubmit}>
            <h3 className="text-xl mb-4">A wild code snippet appears! What spell is missing?</h3>
            <CodeSnippetViewer code={syntaxData.snippet} className="mb-4" />
            <div className="flex gap-2">
                <input
                    type="text"
                    value={typeof userAnswer === 'string' ? userAnswer : ''}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here"
                    className="flex-grow py-2 px-3 rounded-md focus:outline-none focus:ring-2 form-input"
                    autoFocus
                />
                <button type="submit" className="bg-success hover:brightness-110 text-white font-bold py-2 px-4 rounded-md">Submit</button>
            </div>
          </form>
        );
      case 'result':
        const explanation = quizData ? quizData.explanation : syntaxData?.explanation;
        return (
          <div className="flex flex-col h-full">
            <div>
              <h3 className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect!'}
              </h3>
              {explanation && <p className="bg-surface-2 p-3 rounded-md mb-4">{explanation}</p>}
              {!isCorrect && syntaxData && (
                  <p className="mb-4">The correct answer was: <code className="bg-surface-2 p-1 rounded-md font-mono">{syntaxData.blankAnswer}</code></p>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleRetryChallenge} className="flex-1 bg-secondary hover:brightness-110 text-main font-bold py-2 px-4 rounded shadow-lg">
                    Try Another
                  </button>
                  <button onClick={() => setIsExerciseReviewOpen(true)} className="flex-1 bg-primary hover:brightness-110 text-main font-bold py-2 px-4 rounded shadow-lg">
                    Check Exercise
                  </button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-muted flex-grow flex flex-col min-h-0">
              <h4 className="text-lg font-bold text-accent mb-4">Bruno</h4>
              <div className="bg-surface-2 p-3 rounded-lg flex-grow flex flex-col min-h-0">
                {/* Message history */}
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto mb-2 pr-2 space-y-3">
                  {chatHistory.length === 0 && !isChatbotLoading && (
                    <div className="flex items-center justify-center h-full text-muted text-sm">
                      <p>Confused? Ask Bruno for help!</p>
                    </div>
                  )}
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2 rounded-lg max-w-[85%] ${msg.sender === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                           {msg.sender === 'user' ? (
                                <p className="text-sm text-left whitespace-pre-wrap">{msg.text}</p>
                            ) : (
                                <SimpleMarkdownRenderer text={msg.text} />
                            )}
                        </div>
                    </div>
                  ))}
                  {isChatbotLoading && (
                    <div className="flex justify-start">
                      <div className="p-2 rounded-lg bg-secondary">
                        <span className="animate-pulse">...</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Chat input form */}
                <form onSubmit={handleChatSubmit} className="flex gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Bruno... (e.g., Why was my answer wrong?)"
                    className="flex-grow form-input text-sm"
                    disabled={isChatbotLoading}
                  />
                  <button type="submit" disabled={isChatbotLoading || !chatInput.trim()} className="btn btn-accent px-4 py-2 text-sm">
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      case 'duel_difficulty_select':
        if (isCustomizingTime) {
            return (
                <div>
                    <h3 className="text-xl mb-4">Set Custom Timer (in minutes)</h3>
                    <div className="flex gap-4 items-center justify-center">
                        <input
                            type="number"
                            value={customTime}
                            onChange={(e) => setCustomTime(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                            className="w-32 py-2 px-3 rounded-md focus:outline-none focus:ring-2 text-center text-lg form-input"
                            min="1"
                        />
                         <button onClick={() => setupDuel('custom')} className="bg-success hover:brightness-110 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg">
                            Start Duel
                        </button>
                        <button onClick={() => setIsCustomizingTime(false)} className="bg-secondary hover:brightness-110 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg">
                            Cancel
                        </button>
                    </div>
                </div>
            )
        }
        return (
            <div>
                <h3 className="text-xl mb-4">Select Duel Difficulty</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {(['easy', 'medium', 'hard', 'custom', 'none'] as Difficulty[]).map(d => (
                        <button 
                            key={d}
                            onClick={() => d === 'custom' ? setIsCustomizingTime(true) : setupDuel(d)} 
                            className="bg-secondary hover:bg-primary text-main font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
                        >
                            {DIFFICULTY_SETTINGS[d].name}
                        </button>
                    ))}
                </div>
            </div>
        );
      case 'duel_playing':
        if (!duelChallenge) return <Loader />;
        const isImplementationChallenge = 'targetFunction' in duelChallenge;

        return (
            <div className="flex flex-col min-h-full">
                {/* Top Section: Challenge */}
                <div className="flex-grow min-h-[200px] p-4 bg-black bg-opacity-30 rounded-lg border border-muted mb-4 overflow-auto">
                    <h4 className="text-lg font-bold text-accent mb-2">
                        {isImplementationChallenge ? 'Trial of Implementation:' : 'Riddle of Syntax:'}
                    </h4>
                    {error && <p className="text-danger bg-danger p-2 rounded mb-2 text-sm">{error}</p>}
                    
                    <form onSubmit={handleDuelSubmit} className="flex flex-col h-full">
                        <CodeSnippetViewer code={duelChallenge.snippet} className="text-sm mb-3" />

                        {answeringCard ? (
                            <div className="mt-auto">
                                <input
                                    type="text"
                                    value={duelUserAnswer}
                                    onChange={(e) => setDuelUserAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="w-full py-2 px-3 rounded-md focus:outline-none focus:ring-2 form-input"
                                    autoFocus
                                />
                                <button type="submit" className="mt-3 bg-success hover:brightness-110 text-white font-bold py-2 px-4 rounded-md w-full">Submit Answer</button>
                            </div>
                        ) : (
                            <p className="text-accent mt-2 text-center flex-grow flex items-center justify-center">
                                {isImplementationChallenge
                                    ? "The code's power is fading... a key function is missing. Reveal the face-down cards and choose the one that restores its magic!"
                                    : 'A gap in the incantation! The correct function is missing. Select the card from your hand that completes the spell.'
                                }
                            </p>
                        )}
                    </form>
                </div>

                {/* Bottom Section: Hand */}
                <div className="flex-shrink-0 relative group">
                    <h4 className="text-center font-bold mb-2">Your Hand ({hand.length}/7)</h4>
                    
                    {/* Left Scroll Button */}
                    <button 
                        onClick={() => scrollHand('left')}
                        className="absolute left-0 top-[60%] -translate-y-1/2 z-10 p-2 bg-black/60 hover:bg-black/90 text-white rounded-r-lg backdrop-blur-sm transition-all shadow-lg border-y border-r border-gray-600 active:scale-95"
                        aria-label="Scroll Left"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    {/* Right Scroll Button */}
                    <button 
                        onClick={() => scrollHand('right')}
                        className="absolute right-0 top-[60%] -translate-y-1/2 z-10 p-2 bg-black/60 hover:bg-black/90 text-white rounded-l-lg backdrop-blur-sm transition-all shadow-lg border-y border-l border-gray-600 active:scale-95"
                        aria-label="Scroll Right"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <div 
                        ref={handContainerRef}
                        className="flex flex-nowrap justify-start items-center gap-2 sm:gap-4 bg-black bg-opacity-20 p-2 sm:p-4 rounded-lg h-[230px] sm:h-[280px] overflow-x-auto scroll-smooth scrollbar-thin"
                    >
                        {hand.length > 0 ? hand.map(c => (
                             <div 
                                key={c.name}
                                className={`flex-shrink-0 w-[160px] h-[250px] relative group/card ${!answeringCard ? 'cursor-pointer' : 'opacity-70'}`}
                                onClick={() => handleSelectHandCard(c)}
                            >
                                <div className={`absolute top-0 left-0 origin-top-left transform scale-[0.5] transition-transform duration-300 ${revealedCards.has(c.name) ? 'group-hover/card:scale-[0.55] group-hover/card:-translate-y-3' : ''}`}>
                                    <CoderCardComponent 
                                        card={enrichCardForDisplay(c)} 
                                        cardTheme={cardTheme}
                                        isInteractive={!answeringCard}
                                        isRevealed={revealedCards.has(c.name)}
                                        libraryName={libraryName}
                                        onViewDetails={handleViewCardDetails}
                                    />
                                </div>
                            </div>
                        )) : <p className="text-muted w-full text-center">No cards in hand.</p>}
                    </div>
                </div>
            </div>
        );
      case 'duel_game_over':
        const isVictory = duelMessage.title === 'Victory!';
        return (
          <div className="flex flex-col h-full">
              <div>
                  <h3 className={`text-2xl font-bold mb-4 ${isVictory ? 'text-success' : 'text-danger'}`}>
                    {duelMessage.title}
                  </h3>
                  <p className="bg-surface-2 p-3 rounded-md mb-4 whitespace-pre-wrap">{duelMessage.body}</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                      <button onClick={resetBattle} className="flex-1 bg-secondary hover:brightness-110 text-main font-bold py-2 px-4 rounded shadow-lg">
                        Return to Challenge Select
                      </button>
                      <button onClick={() => setIsExerciseReviewOpen(true)} className="flex-1 bg-primary hover:brightness-110 text-main font-bold py-2 px-4 rounded shadow-lg">
                        Check Exercise
                      </button>
                  </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-muted flex-grow flex flex-col min-h-0">
                <h4 className="text-lg font-bold text-accent mb-4">Bruno</h4>
                <div className="bg-surface-2 p-3 rounded-lg flex-grow flex flex-col min-h-0">
                  {/* Message history */}
                  <div ref={chatContainerRef} className="flex-grow overflow-y-auto mb-2 pr-2 space-y-3">
                    {chatHistory.length === 0 && !isChatbotLoading && (
                      <div className="flex items-center justify-center h-full text-muted text-sm">
                        <p>Have questions about the duel? Ask Bruno!</p>
                      </div>
                    )}
                    {chatHistory.map((msg, index) => (
                      <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-2 rounded-lg max-w-[85%] ${msg.sender === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                              {msg.sender === 'user' ? (
                                    <p className="text-sm text-left whitespace-pre-wrap">{msg.text}</p>
                                ) : (
                                    <SimpleMarkdownRenderer text={msg.text} />
                                )}
                          </div>
                      </div>
                    ))}
                    {isChatbotLoading && (
                      <div className="flex justify-start">
                        <div className="p-2 rounded-lg bg-secondary">
                          <span className="animate-pulse">...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Chat input form */}
                  <form onSubmit={handleChatSubmit} className="flex gap-2 flex-shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask Bruno... (e.g., Why was that the right function?)"
                      className="flex-grow form-input text-sm"
                      disabled={isChatbotLoading}
                    />
                    <button type="submit" disabled={isChatbotLoading || !chatInput.trim()} className="btn btn-accent px-4 py-2 text-sm">
                      Send
                    </button>
                  </form>
                </div>
              </div>
          </div>
        );
      case 'idle':
      default:
        return (
          <div>
            <h3 className="text-xl mb-2">Choose your challenge!</h3>
            <p className="text-muted mb-6">Test your knowledge of <span className="font-bold text-accent">{card.name}</span>.</p>
            {error && <p className="text-danger bg-danger p-2 rounded mb-4">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={fetchUseCaseQuiz} className="flex-1 btn btn-primary">
                Trial of Strategy
              </button>
              <button onClick={fetchSyntaxExercise} className="flex-1 btn btn-secondary">
                Incantation Ritual
              </button>
              <button 
                onClick={() => setBattleState('duel_difficulty_select')}
                className="flex-1 btn btn-accent"
                disabled={appMode === 'creative'}
                title={appMode === 'creative' ? "Code Duel is only available in Code Mode" : undefined}
                >
                Code Duel
              </button>
            </div>
          </div>
        );
    }
  };

  const renderDuelStatus = () => {
    if (battleState !== 'duel_playing') return null;
    const isImplementation = duelChallenge && 'targetFunction' in duelChallenge;
    const currentPhase = isImplementation ? (answeringCard ? "Answering Phase" : "Challenge Phase") : "Syntax Phase";
    
    return (
        <div className="sticky top-0 z-20 lg:static w-full lg:w-80 flex-shrink-0 p-2 sm:p-4 bg-surface-1/95 lg:bg-surface-1/50 backdrop-blur-md rounded-lg border-b-2 lg:border-b-0 lg:border-r-2 border-muted flex flex-row lg:flex-col justify-between lg:justify-start items-center gap-2 sm:gap-4 shadow-md lg:shadow-none transition-all duration-300">
            
            {/* Stats Block */}
            <div className="flex flex-row lg:flex-col gap-3 sm:gap-6 items-center lg:items-center flex-grow justify-around lg:justify-start">
                <div className="text-center">
                    <h4 className="font-bold text-xs sm:text-sm lg:text-lg text-muted lg:text-main">{currentPhase}</h4>
                    <p className="text-xl sm:text-2xl lg:text-4xl font-mono text-yellow-300 leading-none mt-1">{formatTime(timer)}</p>
                </div>
                
                {/* Strikes */}
                <div className="text-center flex flex-col items-center">
                     <h4 className="font-bold text-xs sm:text-sm lg:text-lg text-muted lg:text-main hidden sm:block">Strikes</h4>
                     <div className="flex justify-center gap-1 lg:gap-2 mt-1">
                        {[...Array(3)].map((_, i) => (
                            <span key={i} className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-8 lg:h-2 rounded-full ${i < strikes ? 'bg-danger' : 'bg-surface-2 border border-muted'}`}></span>
                        ))}
                    </div>
                </div>

                 <div className="text-center">
                    <h4 className="font-bold text-xs sm:text-sm lg:text-lg text-muted lg:text-main">Deck</h4>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold leading-none mt-1">{deck.length}</p>
                </div>
            </div>

            {/* Buttons Block - Horizontal on Mobile/Tablet, Vertical on Desktop */}
            <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 lg:mt-auto w-auto lg:w-full flex-shrink-0">
                <button onClick={handleDrawCard} disabled={deck.length === 0 || hand.length >= 7 || !!answeringCard} className="btn btn-primary text-xs sm:text-sm py-1.5 px-3 sm:px-4 lg:py-2">Draw</button>
                <button onClick={handleSkipChallenge} disabled={strikes >= 3 || !!answeringCard} className="btn btn-secondary text-xs sm:text-sm py-1.5 px-3 sm:px-4 lg:py-2">Skip</button>
            </div>
        </div>
    )
  }

  return (
    <div 
        className="fixed inset-0 bg-background z-50"
        aria-modal="true"
        role="dialog"
    >
      <CardPreviewModal />
      {isExerciseReviewOpen && <ExerciseReviewModal />}
      <div 
        // CHANGED: h-screen -> h-[100dvh] to fix mobile cutoff
        className="bg-surface-1 w-full h-[100dvh] p-4 md:p-6 lg:p-8 text-center relative flex flex-col"
        style={{ backgroundImage: 'radial-gradient(circle, var(--color-primary-transparent) 0%, transparent 60%)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted hover:text-main z-10"
          aria-label="Close battlefield"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 className="text-2xl lg:text-3xl font-bold mb-4 gradient-text flex-shrink-0">
          Battlefield
        </h2>
        
        {/* Main layout container with scrolling logic. 
            Mobile: overflow-y-auto (entire container scrolls, including top bar stickiness).
            Desktop (lg): overflow-hidden (sidebar static, content scrolls).
        */}
        <div className="flex w-full flex-col lg:flex-row items-stretch gap-6 flex-grow min-h-0 overflow-y-auto lg:overflow-hidden">
            {battleState.startsWith('duel') && (
                <>
                    {renderDuelStatus()}
                    <div className="flex-grow min-h-0 min-w-0 lg:overflow-y-auto pr-2 pb-4">{renderContent()}</div>
                </>
            )}
            {!battleState.startsWith('duel') && (
                 <div className="w-full flex-grow min-h-0 lg:overflow-y-auto pr-2 pb-4">{renderContent()}</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Battlefield;
