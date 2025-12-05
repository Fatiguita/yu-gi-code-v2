export interface CardDescription {
  effect: string;
  parameters: string;
  returns: string;
}

export interface CoderCard {
  name: string;
  attribute: string;
  level: number;
  type: string;
  cardCategory: string; // e.g., 'Effect Monster', 'Spell Card'
  region: string;
  clan: string;
  description: CardDescription;
  impact: number;
  easeOfUse: number;
  imagePrompt: string;
  imageUrl?: string;
  isImageLoading?: boolean;
  language?: string;
  category?: string; // e.g., 'Core', 'Staple', 'Situational', 'Niche'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface SyntaxExercise {
  snippet: string;
  blankAnswer: string;
  explanation: string;
}

export interface ImplementationChallenge {
  snippet:string;
  targetFunction: string;
  blankAnswer: string;
  explanation: string;
}

export interface Theme {
  name: string;
  colors: {
    [key: string]: string;
  };
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface SavedSessionState {
  appMode: 'code' | 'creative';
  presentationCards: CoderCard[];
  cards: CoderCard[];
  allFunctions: string[];
  functionCategories: Record<string, string>;
  selectedFunctions: string[]; // Set converted to array
  searchedLibrary: string;
  searchedLanguage: string;
  cardTheme: 'default' | 'official';
  skillLevel: SkillLevel;
  isManualArtMode: boolean;
  manualImageMap?: [string, string][]; // Map converted to array
}

export interface SavedSession {
  id: number;
  name: string;
  libraryName: string;
  savedAt: number;
  state: SavedSessionState;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}